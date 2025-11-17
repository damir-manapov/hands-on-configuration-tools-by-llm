import { describe, it, expect } from 'vitest';
import { setNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Set Node - Validation', () => {
  it('should throw error when set node is missing values parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    expect(() => {
      setNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when set node has invalid values parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: 'not-an-array',
      },
      connections: [],
    };

    expect(() => {
      setNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when set node has invalid value item', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 123, value: 'test' }],
      },
      connections: [],
    };

    expect(() => {
      setNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should validate set node with valid parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [
          { path: 'field1', value: 'value1' },
          { path: 'field2', value: 'value2' },
        ],
      },
      connections: [],
    };

    expect(() => {
      setNodePlugin.validate(node);
    }).not.toThrow();
  });
});
