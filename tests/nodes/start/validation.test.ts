import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../../../src/engine.js';
import type { WorkflowNode } from '../../../src/types.js';

describe('Start Node - Validation', () => {
  const engine = new WorkflowEngine();

  it('should accept start node with empty parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    expect(() => {
      engine.validateNodeParameters(node);
    }).not.toThrow();
  });
});
