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
  markerNodePlugin,
  ifNodePlugin,
  codeNodePlugin,
  filterNodePlugin,
  switchNodePlugin,
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
  NodeExecutionError,
} from './errors/index.js';

const BUILT_IN_PLUGINS = [
  noopNodePlugin,
  setNodePlugin,
  markerNodePlugin,
  ifNodePlugin,
  codeNodePlugin,
  filterNodePlugin,
  switchNodePlugin,
] as const;

const BUILT_IN_NODE_TYPES = BUILT_IN_PLUGINS.map(
  (plugin) => plugin.nodeType,
) as readonly string[];

export class WorkflowEngine {
  private static readonly MAX_WORKFLOW_NODES = 1000;
  private static readonly MAX_WORKFLOW_CONNECTIONS = 10000;
  private static readonly MAX_ID_LENGTH = 100;
  private static readonly MAX_NAME_LENGTH = 200;
  private static readonly ID_REGEX = /^[a-zA-Z0-9_-]+$/;

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
          title: 'Example',
          type: plugin.nodeType,
          position: { x: 0, y: 0 },
          parameters: example.parameters,
          connections: [],
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
        // Store output per port (nodes can output to multiple ports, e.g., If node -> "true" and "false")
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
    // Validate workflow structure with Zod (including ID format and title length)
    const WorkflowStructureSchema = z.object({
      id: z
        .string()
        .min(1, 'Workflow must have id')
        .max(
          WorkflowEngine.MAX_ID_LENGTH,
          `Workflow ID must be ${WorkflowEngine.MAX_ID_LENGTH} characters or less`,
        )
        .regex(
          WorkflowEngine.ID_REGEX,
          'Workflow ID must contain only alphanumeric characters, dashes, and underscores',
        ),
      title: z
        .string()
        .min(1, 'Workflow must have title')
        .max(
          WorkflowEngine.MAX_NAME_LENGTH,
          `Workflow title must be ${WorkflowEngine.MAX_NAME_LENGTH} characters or less`,
        ),
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

    // Validate maximum limits
    this.validateMaximumLimits(workflow);

    // Validate node structure with Zod (including ID format and title length)
    const NodeStructureSchema = z.object({
      id: z
        .string()
        .min(1)
        .max(
          WorkflowEngine.MAX_ID_LENGTH,
          `Node ID must be ${WorkflowEngine.MAX_ID_LENGTH} characters or less`,
        )
        .regex(
          WorkflowEngine.ID_REGEX,
          'Node ID must contain only alphanumeric characters, dashes, and underscores',
        ),
      title: z
        .string()
        .min(1)
        .max(
          WorkflowEngine.MAX_NAME_LENGTH,
          `Node title must be ${WorkflowEngine.MAX_NAME_LENGTH} characters or less`,
        ),
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

    // Validate unreachable nodes
    this.validateUnreachableNodes(workflow, nodeIds);
  }

  private validateMaximumLimits(workflow: Workflow): void {
    // Validate maximum number of nodes
    if (workflow.nodes.length > WorkflowEngine.MAX_WORKFLOW_NODES) {
      throw new WorkflowValidationError(
        `Workflow cannot have more than ${WorkflowEngine.MAX_WORKFLOW_NODES} nodes`,
      );
    }

    // Validate maximum number of connections
    let totalConnections = 0;
    for (const node of workflow.nodes) {
      totalConnections += node.connections.length;
    }
    if (totalConnections > WorkflowEngine.MAX_WORKFLOW_CONNECTIONS) {
      throw new WorkflowValidationError(
        `Workflow cannot have more than ${WorkflowEngine.MAX_WORKFLOW_CONNECTIONS} connections`,
      );
    }
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
        outputPort: z
          .string()
          .min(1, 'outputPort field is required and must be a non-empty string')
          .trim()
          .min(1, 'outputPort field cannot be empty'),
      })
      .strict();

    // Connections array schema
    const ConnectionsArraySchema = z.array(ConnectionSchema);

    const connectionSet = new Set<string>();

    for (const node of workflow.nodes) {
      // Validate connections is an array and each connection structure
      const arrayResult = ConnectionsArraySchema.safeParse(node.connections);
      if (!arrayResult.success) {
        const firstError = arrayResult.error.issues[0];
        if (!firstError) {
          throw new WorkflowValidationError(
            `Node ${node.id} has invalid connections`,
          );
        }
        const errorPath =
          firstError.path.length > 0 ? `[${firstError.path.join('][')}]` : '';
        throw new WorkflowValidationError(
          `Node ${node.id} has invalid connection${errorPath}: ${firstError.message}`,
        );
      }

      // Get plugin to validate output ports (only for static nodes)
      const plugin = this.nodePlugins.get(node.type);
      if (!plugin) {
        // This should not happen as node type is validated earlier, but keep as safety net
        throw new WorkflowValidationError(
          `Node ${node.id} has unknown type "${node.type}"`,
        );
      }

      // Validate workflow-specific rules (node exists, no self-reference, no duplicates, valid output ports)
      // For static nodes, validate output ports here. For dynamic nodes, validation is done in the node's validate function.
      const allowedPorts = plugin.dynamicOutputsAllowed
        ? null // Dynamic nodes validate output ports in their validate function
        : plugin.outputPorts;

      for (const [index, connection] of node.connections.entries()) {
        // Validate output port is allowed for this node type (only for static nodes)
        if (allowedPorts && !allowedPorts.includes(connection.outputPort)) {
          throw new WorkflowValidationError(
            `Node ${node.id} uses invalid output port "${connection.outputPort}" at connection[${index}]. Allowed ports: ${allowedPorts.join(', ')}`,
          );
        }

        // Validate target node exists
        if (!nodeIds.has(connection.node)) {
          throw new WorkflowValidationError(
            `Node ${node.id} connects to non-existent node "${connection.node}" at connection[${index}]`,
          );
        }

        // Validate no self-reference
        if (connection.node === node.id) {
          throw new WorkflowValidationError(
            `Node ${node.id} cannot connect to itself at connection[${index}]`,
          );
        }

        // Validate no duplicate connections
        const connectionKey = `${node.id}:${connection.outputPort}->${connection.node}:${connection.outputPort}`;
        if (connectionSet.has(connectionKey)) {
          throw new WorkflowValidationError(
            `Duplicate connection from node "${node.id}" port "${connection.outputPort}" to node "${connection.node}" port "${connection.outputPort}"`,
          );
        }
        connectionSet.add(connectionKey);
      }
    }
  }

  private validateUnreachableNodes(
    workflow: Workflow,
    nodeIds: Set<string>,
  ): void {
    const reachable = new Set<string>();

    // Find entry points (nodes with no incoming connections)
    // These can execute immediately with empty input data
    const incomingConnections = this.buildIncomingConnections(workflow);
    const entryPoints = workflow.nodes.filter((node) => {
      const connections = incomingConnections[node.id];
      return !connections || connections.length === 0;
    });

    // If no entry points exist, all nodes have incoming connections
    // This is valid - nodes can receive external input via inputData parameter
    // or they form a cycle where all nodes are reachable from each other
    // Skip unreachable check in this case
    if (entryPoints.length === 0) {
      return;
    }

    // BFS from entry points to find all reachable nodes
    const queue = [...entryPoints.map((n) => n.id)];
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (!nodeId || reachable.has(nodeId)) {
        continue;
      }

      reachable.add(nodeId);
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (node) {
        for (const connection of node.connections) {
          if (!reachable.has(connection.node)) {
            queue.push(connection.node);
          }
        }
      }
    }

    // Check for unreachable nodes (isolated subgraphs)
    // Only report nodes that are disconnected from entry points
    const unreachable = Array.from(nodeIds).filter((id) => !reachable.has(id));
    if (unreachable.length > 0) {
      throw new WorkflowValidationError(
        `Unreachable nodes detected: ${unreachable.join(', ')}`,
      );
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

      for (const connection of node.connections) {
        visit(connection.node);
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
      for (const connection of sourceNode.connections) {
        // Connections are validated in validateConnections(), but we keep this check
        // as a safety net for TypeScript and runtime safety
        const targetNodeId = connection.node;
        if (!targetNodeId) {
          continue;
        }
        incoming[targetNodeId] ??= [];
        incoming[targetNodeId].push({
          node: sourceNode.id,
          outputPort: connection.outputPort,
        });
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
      // Check for "main" port as default
      const nodeOutputs = executionData[node.id];
      const nodeData = nodeOutputs?.['main'];
      if (nodeData && nodeData.length > 0) {
        return nodeData;
      }
      return [[]];
    }

    for (const connection of connections) {
      const sourceOutputs = executionData[connection.node];
      const sourceBatches = sourceOutputs?.[connection.outputPort];
      if (sourceBatches && sourceBatches.length > 0) {
        // For each batch from the source port, add it as an input batch
        // This allows multiple batches from the same port to be processed
        for (const batch of sourceBatches) {
          input.push(batch);
        }
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
  ): Promise<Record<string, TypedField[][]>> {
    const plugin = this.nodePlugins.get(node.type);
    if (!plugin) {
      throw new UnknownNodeTypeError(node.id, node.type, 'execution');
    }
    const result = await plugin.execute(node, input, resolver);
    // Ensure result is a Record (for backward compatibility, single-port nodes return { main: batches })
    if (
      !result ||
      typeof result !== 'object' ||
      Array.isArray(result) ||
      result === null
    ) {
      const error = new NodeExecutionError(
        node.id,
        `Node ${node.id} (${node.type}) must return a Record<string, TypedField[][]> mapping output ports to batches`,
      );
      throw error;
    }
    return result;
  }
}
