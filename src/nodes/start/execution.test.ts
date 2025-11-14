import { describe, it, expect } from 'vitest';
import { executeStartNode } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Start Node - Execution', () => {
  it('should execute start node and return empty array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    const result = executeStartNode(node, [[{ test: 'data' }]]);

    expect(result).toEqual([[]]);
  });

  it('should execute start node with empty input', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    const result = executeStartNode(node, []);

    expect(result).toEqual([[]]);
  });
});
