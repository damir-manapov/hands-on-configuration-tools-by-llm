import type {
  Workflow,
  WorkflowNode,
  ExecutionData,
  ExecutionResult,
  FieldResolver,
} from './types.js';
import type { TypedField } from './types.js';
import type { NodePlugin } from './plugin.js';
import {
  startNodePlugin,
  setNodePlugin,
  ifNodePlugin,
  codeNodePlugin,
  filterNodePlugin,
} from './nodes/index.js';
import {
  WorkflowNotFoundError,
  WorkflowAlreadyExistsError,
  WorkflowNotActiveError,
  WorkflowValidationError,
  NodeNotFoundError,
  NodeValidationError,
  NodeTypeError,
  DuplicateNodeIdError,
  UnknownNodeTypeError,
  NodeTypeAlreadyRegisteredError,
  CannotUnregisterBuiltInNodeError,
} from './errors/index.js';

const BUILT_IN_PLUGINS = [
  startNodePlugin,
  setNodePlugin,
  ifNodePlugin,
  codeNodePlugin,
  filterNodePlugin,
] as const;

const BUILT_IN_NODE_TYPES = BUILT_IN_PLUGINS.map(
  (plugin) => plugin.nodeType,
) as readonly string[];

export class WorkflowEngine {
  private workflows = new Map<string, Workflow>();
  private nodePlugins = new Map<string, NodePlugin>();

  constructor() {
    // Register built-in nodes
    for (const plugin of BUILT_IN_PLUGINS) {
      this.registerNode(plugin);
    }
  }

  registerNode(plugin: NodePlugin): void {
    if (this.nodePlugins.has(plugin.nodeType)) {
      throw new NodeTypeAlreadyRegisteredError(plugin.nodeType);
    }

    // Validate parameters examples if provided
    if (plugin.parametersExamples) {
      for (const [index, example] of plugin.parametersExamples.entries()) {
        const node: WorkflowNode = {
          id: `example-${index}`,
          name: 'Example',
          type: plugin.nodeType,
          position: { x: 0, y: 0 },
          parameters: example.parameters,
          connections: {},
        };

        try {
          plugin.validate(node);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          throw new NodeValidationError(
            `parametersExample[${index}]`,
            plugin.nodeType,
            `Example "${example.title}" failed validation: ${errorMessage}`,
          );
        }
      }
    }

    this.nodePlugins.set(plugin.nodeType, plugin);
  }

  unregisterNode(nodeType: string): void {
    // Prevent unregistering built-in nodes
    if (BUILT_IN_NODE_TYPES.includes(nodeType)) {
      throw new CannotUnregisterBuiltInNodeError(nodeType);
    }
    this.nodePlugins.delete(nodeType);
  }

  getRegisteredNodeTypes(): string[] {
    return Array.from(this.nodePlugins.keys());
  }

  getRegisteredNodePlugins(): NodePlugin[] {
    return Array.from(this.nodePlugins.values());
  }

  addWorkflow(workflow: Workflow): void {
    if (this.workflows.has(workflow.id)) {
      throw new WorkflowAlreadyExistsError(workflow.id);
    }
    this.validateWorkflow(workflow);
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(id: string): Workflow {
    this.ensureWorkflowExists(id);
    return this.workflows.get(id)!;
  }

  removeWorkflow(id: string): void {
    this.ensureWorkflowExists(id);
    this.workflows.delete(id);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  async executeWorkflow(
    id: string,
    inputData?: ExecutionData,
    resolver?: FieldResolver,
  ): Promise<ExecutionResult> {
    const workflow = this.getWorkflow(id);

    if (!workflow.active) {
      throw new WorkflowNotActiveError(id);
    }

    const executionData: ExecutionData = inputData ?? {};
    const executionOrder = this.getExecutionOrder(workflow);

    try {
      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) {
          throw new NodeNotFoundError(nodeId, id);
        }

        const input = this.getNodeInput(node, workflow, executionData);
        const output = await this.executeNode(node, input, resolver);
        executionData[nodeId] = output;
      }

      return {
        data: executionData,
        finished: true,
      };
    } catch (error) {
      return {
        data: executionData,
        finished: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private ensureWorkflowExists(id: string): void {
    if (!this.workflows.has(id)) {
      throw new WorkflowNotFoundError(id);
    }
  }

  private validateWorkflow(workflow: Workflow): void {
    if (!workflow.id || !workflow.name) {
      throw new WorkflowValidationError('Workflow must have id and name');
    }

    if (!Array.isArray(workflow.nodes)) {
      throw new WorkflowValidationError('Workflow must have nodes array');
    }

    const nodeIds = new Set<string>();
    for (const node of workflow.nodes) {
      if (nodeIds.has(node.id)) {
        throw new DuplicateNodeIdError(node.id);
      }

      if (!node.type) {
        throw new WorkflowValidationError(`Node ${node.id} must have a type`);
      }

      if (!this.nodePlugins.has(node.type)) {
        const validTypes = this.getRegisteredNodeTypes();
        throw new NodeTypeError(node.id, node.type, validTypes);
      }

      this.validateNodeParameters(node);

      nodeIds.add(node.id);
    }
  }

  private validateNodeParameters(node: WorkflowNode): void {
    const plugin = this.nodePlugins.get(node.type);
    if (!plugin) {
      throw new UnknownNodeTypeError(node.id, node.type, 'validation');
    }
    plugin.validate(node);
  }

  private getExecutionOrder(workflow: Workflow): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) {
        return;
      }

      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) {
        throw new NodeNotFoundError(nodeId, workflow.id);
      }

      for (const outputConnections of Object.values(node.connections)) {
        for (const connectionGroup of outputConnections) {
          for (const connection of connectionGroup) {
            visit(connection.node);
          }
        }
      }

      visited.add(nodeId);
      order.push(nodeId);
    };

    for (const node of workflow.nodes) {
      visit(node.id);
    }

    return order.reverse();
  }

  private getNodeInput(
    node: WorkflowNode,
    workflow: Workflow,
    executionData: ExecutionData,
  ): TypedField[][] {
    const input: TypedField[][] = [];

    const connections = workflow.connections[node.id];
    if (!connections || connections.length === 0) {
      // If no connections, check if there's input data provided for this node
      const nodeData = executionData[node.id];
      if (nodeData && nodeData.length > 0) {
        return nodeData;
      }
      return [[]];
    }

    for (const connection of connections) {
      const sourceData = executionData[connection.node];
      const sourceItem = sourceData?.[connection.index];
      if (sourceItem) {
        input.push(sourceItem);
      } else {
        input.push([]);
      }
    }

    return input.length > 0 ? input : [[]];
  }

  private async executeNode(
    node: WorkflowNode,
    input: TypedField[][],
    resolver?: FieldResolver,
  ): Promise<TypedField[][]> {
    const plugin = this.nodePlugins.get(node.type);
    if (!plugin) {
      throw new UnknownNodeTypeError(node.id, node.type, 'execution');
    }
    const result = await plugin.execute(node, input, resolver);
    return result;
  }
}
