import type {
  Workflow,
  WorkflowNode,
  ExecutionData,
  ExecutionResult,
} from './types.js';
import {
  validateStartNodeParameters,
  validateSetNodeParameters,
  validateIfNodeParameters,
  executeStartNode,
  executeSetNode,
  executeIfNode,
} from './nodes/index.js';
import {
  WorkflowNotFoundError,
  WorkflowAlreadyExistsError,
  WorkflowNotActiveError,
  WorkflowValidationError,
  NodeNotFoundError,
  NodeTypeError,
  DuplicateNodeIdError,
  UnknownNodeTypeError,
} from './errors.js';

const VALID_NODE_TYPES = [
  'n8n-nodes-base.start',
  'n8n-nodes-base.set',
  'n8n-nodes-base.if',
] as const;

export type ValidNodeType = (typeof VALID_NODE_TYPES)[number];

export class WorkflowEngine {
  private workflows = new Map<string, Workflow>();

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

      if (!VALID_NODE_TYPES.includes(node.type as ValidNodeType)) {
        throw new NodeTypeError(node.id, node.type, VALID_NODE_TYPES);
      }

      this.validateNodeParameters(node);

      nodeIds.add(node.id);
    }
  }

  private validateNodeParameters(node: WorkflowNode): void {
    switch (node.type) {
      case 'n8n-nodes-base.start':
        validateStartNodeParameters(node);
        break;
      case 'n8n-nodes-base.set':
        validateSetNodeParameters(node);
        break;
      case 'n8n-nodes-base.if':
        validateIfNodeParameters(node);
        break;
      default:
        throw new UnknownNodeTypeError(node.id, node.type, 'validation');
    }
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
    switch (node.type) {
      case 'n8n-nodes-base.start':
        return Promise.resolve(executeStartNode(node, input));
      case 'n8n-nodes-base.set':
        return Promise.resolve(executeSetNode(node, input));
      case 'n8n-nodes-base.if':
        return Promise.resolve(executeIfNode(node, input));
      default:
        throw new UnknownNodeTypeError(node.id, node.type, 'execution');
    }
  }
}
