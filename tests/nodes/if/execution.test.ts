import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../../../src/engine.js';
import type { WorkflowNode } from '../../../src/types.js';

describe('If Node - Execution', () => {
  const engine = new WorkflowEngine();

  it('should execute if node with equals operator - match', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'equals',
        },
      },
      connections: {},
    };

    const input = [[{ status: 'active', name: 'test' }]];
    const result = await engine.executeNode(node, input);

    expect(result).toHaveLength(1);
    expect(result[0]?.[0]).toEqual({
      status: 'active',
      name: 'test',
      _matched: true,
    });
  });

  it('should execute if node with equals operator - no match', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'equals',
        },
      },
      connections: {},
    };

    const input = [[{ status: 'inactive', name: 'test' }]];
    const result = await engine.executeNode(node, input);

    expect(result[0]?.[0]).toEqual({
      status: 'inactive',
      name: 'test',
      _matched: false,
    });
  });

  it('should execute if node with notEquals operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'notEquals',
        },
      },
      connections: {},
    };

    const input = [[{ status: 'inactive' }]];
    const result = await engine.executeNode(node, input);

    expect(result[0]?.[0]).toEqual({
      status: 'inactive',
      _matched: true,
    });
  });

  it('should execute if node with contains operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'message',
          rightValue: 'error',
          operator: 'contains',
        },
      },
      connections: {},
    };

    const input = [[{ message: 'This is an error message' }]];
    const result = await engine.executeNode(node, input);

    expect(result[0]?.[0]).toEqual({
      message: 'This is an error message',
      _matched: true,
    });
  });

  it('should execute if node with contains operator - no match', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'message',
          rightValue: 'error',
          operator: 'contains',
        },
      },
      connections: {},
    };

    const input = [[{ message: 'This is a success message' }]];
    const result = await engine.executeNode(node, input);

    expect(result[0]?.[0]).toEqual({
      message: 'This is a success message',
      _matched: false,
    });
  });

  it('should execute if node with missing field', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'missing',
          rightValue: 'value',
          operator: 'equals',
        },
      },
      connections: {},
    };

    const input = [[{ other: 'field' }]];
    const result = await engine.executeNode(node, input);

    expect(result[0]?.[0]).toEqual({
      other: 'field',
      _matched: false,
    });
  });

  it('should execute if node with number field value', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'count',
          rightValue: '5',
          operator: 'equals',
        },
      },
      connections: {},
    };

    const input = [[{ count: 5 }]];
    const result = await engine.executeNode(node, input);

    expect(result[0]?.[0]).toEqual({
      count: 5,
      _matched: true,
    });
  });

  it('should execute if node with boolean field value', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'enabled',
          rightValue: 'true',
          operator: 'equals',
        },
      },
      connections: {},
    };

    const input = [[{ enabled: true }]];
    const result = await engine.executeNode(node, input);

    expect(result[0]?.[0]).toEqual({
      enabled: true,
      _matched: true,
    });
  });

  it('should execute if node with multiple input items', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'equals',
        },
      },
      connections: {},
    };

    const input = [
      [{ status: 'active' }],
      [{ status: 'inactive' }],
      [{ status: 'active' }],
    ];
    const result = await engine.executeNode(node, input);

    expect(result).toHaveLength(3);
    expect(result[0]?.[0]).toEqual({ status: 'active', _matched: true });
    expect(result[1]?.[0]).toEqual({ status: 'inactive', _matched: false });
    expect(result[2]?.[0]).toEqual({ status: 'active', _matched: true });
  });
});
