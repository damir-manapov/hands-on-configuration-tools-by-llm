import type {
  Workflow,
  WorkflowNode,
  ExecutionData,
  ExecutionResult,
} from './types.js';
import type { NodePlugin } from './plugin.js';
import { startNodePlugin, setNodePlugin, ifNodePlugin } from './nodes/index.js';
import {
  WorkflowNotFoundError,
  WorkflowAlreadyExistsError,
  WorkflowNotActiveError,
  WorkflowValidationError,
  NodeNotFoundError,
  NodeTypeError,
  DuplicateNodeIdError,
  UnknownNodeTypeError,
  NodeTypeAlreadyRegisteredError,
  CannotUnregisterBuiltInNodeError,
} from './errors.js';

export class WorkflowEngine {
  private workflows = new Map<string, Workflow>();
  private nodePlugins = new Map<string, NodePlugin>();

  constructor() {
    // Register built-in nodes
    this.registerNode(startNodePlugin);
    this.registerNode(setNodePlugin);
    this.registerNode(ifNodePlugin);
  }

  registerNode(plugin: NodePlugin): void {
    if (this.nodePlugins.has(plugin.nodeType)) {
      throw new NodeTypeAlreadyRegisteredError(plugin.nodeType);
    }
    this.nodePlugins.set(plugin.nodeType, plugin);
  }

  unregisterNode(nodeType: string): void {
    // Prevent unregistering built-in nodes
    const builtInTypes = ['builtIn.start', 'builtIn.set', 'builtIn.if'];
    if (builtInTypes.includes(nodeType)) {
      throw new CannotUnregisterBuiltInNodeError(nodeType);
    }
    this.nodePlugins.delete(nodeType);
  }

  getRegisteredNodeTypes(): string[] {
    return Array.from(this.nodePlugins.keys());
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
        const output = await this.executeNode(node, input);
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
  ): unknown[][] {
    const input: unknown[][] = [];

    const connections = workflow.connections[node.id];
    if (!connections || connections.length === 0) {
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
    input: unknown[][],
  ): Promise<unknown[][]> {
    const plugin = this.nodePlugins.get(node.type);
    if (!plugin) {
      throw new UnknownNodeTypeError(node.id, node.type, 'execution');
    }
    const result = plugin.execute(node, input);
    return Promise.resolve(result);
  }
}
