import { describe, it, expect } from 'vitest';
import { startNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';
import type { TypedField } from '../../types.js';

describe('Start Node - Execution', () => {
  it('should execute start node and return empty array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Start',
      type: 'builtIn.start',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    const input: TypedField[][] = [
      [
        {
          value: { test: { value: 'data', kind: 'primitive' } },
          kind: 'primitive',
        },
      ],
    ];
    const result = startNodePlugin.execute(node, input);

    expect(result).toEqual([[]]);
  });

  it('should execute start node with empty input', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Start',
      type: 'builtIn.start',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    const input: TypedField[][] = [];
    const result = startNodePlugin.execute(node, input);

    expect(result).toEqual([[]]);
  });
});
