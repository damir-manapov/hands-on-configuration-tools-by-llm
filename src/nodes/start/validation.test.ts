import { describe, it, expect } from 'vitest';
import { validateStartNodeParameters } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Start Node - Validation', () => {
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
      validateStartNodeParameters(node);
    }).not.toThrow();
  });
});
