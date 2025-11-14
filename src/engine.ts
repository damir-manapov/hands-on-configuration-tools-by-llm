import type {
  Workflow,
  WorkflowNode,
  ExecutionData,
  ExecutionResult,
} from './types.js';

export class WorkflowEngine {
  private workflows = new Map<string, Workflow>();

  addWorkflow(workflow: Workflow): void {
    if (this.workflows.has(workflow.id)) {
      throw new Error(`Workflow with id ${workflow.id} already exists`);
    }
    this.validateWorkflow(workflow);
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  removeWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  async executeWorkflow(
    id: string,
    inputData?: ExecutionData,
  ): Promise<ExecutionResult> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow with id ${id} not found`);
    }

    if (!workflow.active) {
      throw new Error(`Workflow ${id} is not active`);
    }

    const executionData: ExecutionData = inputData ?? {};
    const executionOrder = this.getExecutionOrder(workflow);

    try {
      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) {
          continue;
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

  private validateWorkflow(workflow: Workflow): void {
    if (!workflow.id || !workflow.name) {
      throw new Error('Workflow must have id and name');
    }

    if (!Array.isArray(workflow.nodes)) {
      throw new Error('Workflow must have nodes array');
    }

    const nodeIds = new Set<string>();
    for (const node of workflow.nodes) {
      if (nodeIds.has(node.id)) {
        throw new Error(`Duplicate node id: ${node.id}`);
      }
      nodeIds.add(node.id);
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
        return;
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
        return Promise.resolve([[]]);
      case 'n8n-nodes-base.set':
        return Promise.resolve(this.executeSetNode(node, input));
      case 'n8n-nodes-base.if':
        return Promise.resolve(this.executeIfNode(node, input));
      default:
        return Promise.resolve(input);
    }
  }

  private executeSetNode(node: WorkflowNode, input: unknown[][]): unknown[][] {
    const values =
      (node.parameters['values'] as { name: string; value: string }[]) ?? [];
    const result: unknown[][] = [];

    for (const inputItem of input) {
      const outputItem: Record<string, unknown> = {
        ...(inputItem[0] as Record<string, unknown>),
      };
      for (const value of values) {
        outputItem[value.name] = value.value;
      }
      result.push([outputItem]);
    }

    return result;
  }

  private executeIfNode(node: WorkflowNode, input: unknown[][]): unknown[][] {
    const conditions = (node.parameters['conditions'] as {
      leftValue: string;
      rightValue: string;
      operator: string;
    }) ?? { leftValue: '', rightValue: '', operator: 'equals' };

    const result: unknown[][] = [];

    for (const inputItem of input) {
      const item = inputItem[0] as Record<string, unknown>;
      const leftValueRaw = item[conditions.leftValue];
      let leftValue = '';
      if (
        leftValueRaw !== null &&
        leftValueRaw !== undefined &&
        (typeof leftValueRaw === 'string' ||
          typeof leftValueRaw === 'number' ||
          typeof leftValueRaw === 'boolean')
      ) {
        leftValue = String(leftValueRaw);
      }
      const rightValue = conditions.rightValue;
      let matches = false;

      switch (conditions.operator) {
        case 'equals':
          matches = leftValue === rightValue;
          break;
        case 'notEquals':
          matches = leftValue !== rightValue;
          break;
        case 'contains':
          matches = leftValue.includes(rightValue);
          break;
        default:
          matches = false;
      }

      result.push([{ ...item, _matched: matches }]);
    }

    return result;
  }
}
