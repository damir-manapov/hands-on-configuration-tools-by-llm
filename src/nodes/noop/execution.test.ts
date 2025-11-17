import { describe, it, expect } from 'vitest';
import { noopNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';
import type { TypedField } from '../../types.js';

describe('Noop Node - Execution', () => {
  it('should pass through input data unchanged', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Noop',
      type: 'builtIn.noop',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    const input: TypedField[][] = [
      [
        {
          value: { test: { value: 'data', kind: 'primitive' } },
          kind: 'primitive',
        },
      ],
    ];
    const result = noopNodePlugin.execute(node, input);

    expect(result).toEqual(input);
  });

  it('should return empty array when input is empty', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Noop',
      type: 'builtIn.noop',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    const input: TypedField[][] = [];
    const result = noopNodePlugin.execute(node, input);

    expect(result).toEqual([[]]);
  });

  it('should pass through multiple batches', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Noop',
      type: 'builtIn.noop',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    const input: TypedField[][] = [
      [{ value: 'batch1', kind: 'primitive' }],
      [{ value: 'batch2', kind: 'primitive' }],
    ];
    const result = noopNodePlugin.execute(node, input);

    expect(result).toEqual(input);
  });
});
