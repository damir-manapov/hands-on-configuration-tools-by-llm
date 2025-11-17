import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/engine.js';
import type { Workflow } from '../src/types.js';

describe('WorkflowEngine - General Validation', () => {
  it('should throw error when node has invalid type', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Invalid Node',
          type: 'invalid-node-type',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('invalid type');
  });

  it('should throw error when node has no type', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'No Type Node',
          type: '',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('must have a type');
  });
});
