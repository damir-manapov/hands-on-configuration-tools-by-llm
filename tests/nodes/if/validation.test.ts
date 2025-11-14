import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../../../src/engine.js';
import type { WorkflowNode } from '../../../src/types.js';

describe('If Node - Validation', () => {
  const engine = new WorkflowEngine();

  it('should throw error when if node is missing conditions parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If Node',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has invalid conditions parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If Node',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: 'not-an-object',
      },
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has missing condition fields', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If Node',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'field1',
          rightValue: 'value1',
        },
      },
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has invalid operator', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If Node',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'field1',
          rightValue: 'value1',
          operator: 'invalid-operator',
        },
      },
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).toThrow('has invalid parameters');
  });

  it('should validate if node with valid parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If Node',
      type: 'n8n-nodes-base.if',
      position: { x: 0, y: 0 },
      parameters: {
        conditions: {
          leftValue: 'field1',
          rightValue: 'value1',
          operator: 'equals',
        },
      },
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).not.toThrow();
  });
});
