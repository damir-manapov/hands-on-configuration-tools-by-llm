import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../../../src/engine.js';
import type { WorkflowNode } from '../../../src/types.js';

describe('Set Node - Validation', () => {
  const engine = new WorkflowEngine();

  it('should throw error when set node is missing values parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set Node',
      type: 'n8n-nodes-base.set',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when set node has invalid values parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set Node',
      type: 'n8n-nodes-base.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: 'not-an-array',
      },
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when set node has invalid value item', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set Node',
      type: 'n8n-nodes-base.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ name: 123, value: 'test' }],
      },
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).toThrow('has invalid parameters');
  });

  it('should validate set node with valid parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set Node',
      type: 'n8n-nodes-base.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [
          { name: 'field1', value: 'value1' },
          { name: 'field2', value: 'value2' },
        ],
      },
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).not.toThrow();
  });
});
