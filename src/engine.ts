import { z } from 'zod';
import type {
  Workflow,
  WorkflowNode,
  ExecutionData,
  ExecutionResult,
  FieldResolver,
  Connection,
} from './types.js';
import type { TypedField } from './types.js';
import type { NodePlugin } from './plugin.js';
import {
  noopNodePlugin,
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
  noopNodePlugin,
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
    const incomingConnections = this.buildIncomingConnections(workflow);

    try {
      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) {
          throw new NodeNotFoundError(nodeId, id);
        }

        const input = this.getNodeInput(
          node,
          incomingConnections,
          executionData,
        );
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
    // Validate workflow structure with Zod
    const WorkflowStructureSchema = z.object({
      id: z.string().min(1, 'Workflow must have id'),
      name: z.string().min(1, 'Workflow must have name'),
      nodes: z.array(z.any()),
      active: z.boolean(),
    });

    try {
      WorkflowStructureSchema.parse(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstIssue = error.issues[0];
        throw new WorkflowValidationError(
          firstIssue?.message ?? 'Workflow structure validation failed',
        );
      }
      throw error;
    }

    // Validate node structure with Zod (connections validated separately)
    const NodeStructureSchema = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      type: z.string().min(1),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      parameters: z.record(z.string(), z.unknown()),
      // connections validated separately in validateConnections()
      // Note: Zod allows extra fields by default, so connections field will pass through
    });

    const nodeIds = new Set<string>();
    for (const node of workflow.nodes) {
      // Validate node structure
      try {
        NodeStructureSchema.parse(node);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstIssue = error.issues[0];
          const field = firstIssue?.path.join('.') ?? 'unknown';
          throw new WorkflowValidationError(
            `Node ${node.id ?? 'unknown'} has invalid ${field}: ${firstIssue?.message ?? 'validation failed'}`,
          );
        }
        throw error;
      }

      // Context-dependent validations (keep as manual checks)
      if (nodeIds.has(node.id)) {
        throw new DuplicateNodeIdError(node.id);
      }

      if (!this.nodePlugins.has(node.type)) {
        const validTypes = this.getRegisteredNodeTypes();
        throw new NodeTypeError(node.id, node.type, validTypes);
      }

      this.validateNodeParameters(node);

      nodeIds.add(node.id);
    }

    // Validate connections after all nodes are validated and IDs are collected
    this.validateConnections(workflow, nodeIds);
  }

  private validateConnections(workflow: Workflow, nodeIds: Set<string>): void {
    // Base Connection schema for structure validation
    const ConnectionSchema = z
      .object({
        node: z
          .string()
          .min(1, 'node field is required and must be a non-empty string')
          .trim()
          .min(1, 'node field cannot be empty'),
        type: z
          .string()
          .min(1, 'type field is required and must be a non-empty string')
          .trim()
          .min(1, 'type field cannot be empty'),
        index: z
          .number()
          .int('index must be an integer')
          .nonnegative('index must be a non-negative integer'),
      })
      .strict();

    // Connections array schema
    const ConnectionsArraySchema = z.array(ConnectionSchema);

    for (const node of workflow.nodes) {
      for (const [outputPort, connections] of Object.entries(
        node.connections,
      )) {
        // Validate connections is an array and each connection structure
        const arrayResult = ConnectionsArraySchema.safeParse(connections);
        if (!arrayResult.success) {
          const firstError = arrayResult.error.issues[0];
          if (!firstError) {
            throw new WorkflowValidationError(
              `Node ${node.id} has invalid connections for output port "${outputPort}"`,
            );
          }
          const errorPath =
            firstError.path.length > 0 ? `[${firstError.path.join('][')}]` : '';
          throw new WorkflowValidationError(
            `Node ${node.id} has invalid connection at output port "${outputPort}"${errorPath}: ${firstError.message}`,
          );
        }

        // Validate workflow-specific rules (node exists, no self-reference)
        for (const [index, connection] of connections.entries()) {
          // Validate target node exists
          if (!nodeIds.has(connection.node)) {
            throw new WorkflowValidationError(
              `Node ${node.id} connects to non-existent node "${connection.node}" at output port "${outputPort}"[${index}]`,
            );
          }

          // Validate no self-reference
          if (connection.node === node.id) {
            throw new WorkflowValidationError(
              `Node ${node.id} cannot connect to itself at output port "${outputPort}"[${index}]`,
            );
          }
        }
      }
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
        for (const connection of outputConnections) {
          visit(connection.node);
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

  private buildIncomingConnections(
    workflow: Workflow,
  ): Record<string, Connection[]> {
    const incoming: Record<string, Connection[]> = {};

    for (const sourceNode of workflow.nodes) {
      for (const outputConnections of Object.values(sourceNode.connections)) {
        for (const connection of outputConnections) {
          // Connections are validated in validateConnections(), but we keep this check
          // as a safety net for TypeScript and runtime safety
          const targetNodeId = connection.node;
          if (!targetNodeId) {
            continue;
          }
          incoming[targetNodeId] ??= [];
          incoming[targetNodeId].push({
            node: sourceNode.id,
            type: connection.type,
            index: connection.index,
          });
        }
      }
    }

    return incoming;
  }

  private getNodeInput(
    node: WorkflowNode,
    incomingConnections: Record<string, Connection[]>,
    executionData: ExecutionData,
  ): TypedField[][] {
    const input: TypedField[][] = [];

    const connections = incomingConnections[node.id];
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
