import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../../../src/engine.js';
import type { WorkflowNode } from '../../../src/types.js';

describe('Start Node - Execution', () => {
  const engine = new WorkflowEngine();

  it('should execute start node and return empty array', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    const result = await engine.executeNode(node, [[{ test: 'data' }]]);

    expect(result).toEqual([[]]);
  });

  it('should execute start node with empty input', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    const result = await engine.executeNode(node, []);

    expect(result).toEqual([[]]);
  });
});
