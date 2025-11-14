import { describe, it, expect } from 'vitest';
import { setNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Set Node - Execution', () => {
  it('should execute set node and add values', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [
          { name: 'field1', value: 'value1' },
          { name: 'field2', value: 'value2' },
        ],
      },
      connections: {},
    };

    const input = [[{ existing: 'data' }]];
    const result = setNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0]?.[0]).toEqual({
      existing: 'data',
      field1: 'value1',
      field2: 'value2',
    });
  });

  it('should execute set node with empty values array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [],
      },
      connections: {},
    };

    const input = [[{ existing: 'data' }]];
    const result = setNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0]?.[0]).toEqual({ existing: 'data' });
  });

  it('should execute set node with multiple input items', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ name: 'added', value: 'value' }],
      },
      connections: {},
    };

    const input = [[{ item1: 'data1' }], [{ item2: 'data2' }]];
    const result = setNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(2);
    expect(result[0]?.[0]).toEqual({ item1: 'data1', added: 'value' });
    expect(result[1]?.[0]).toEqual({ item2: 'data2', added: 'value' });
  });

  it('should execute set node and overwrite existing fields', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ name: 'field1', value: 'new-value' }],
      },
      connections: {},
    };

    const input = [[{ field1: 'old-value', field2: 'keep' }]];
    const result = setNodePlugin.execute(node, input) as unknown[][];

    expect(result[0]?.[0]).toEqual({
      field1: 'new-value',
      field2: 'keep',
    });
  });
});
