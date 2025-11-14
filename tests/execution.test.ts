import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/engine.js';
import type { Workflow } from '../src/types.js';

describe('WorkflowEngine - Execution', () => {
  it('should execute simple workflow', async () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
      connections: {},
    };

    engine.addWorkflow(workflow);
    const result = await engine.executeWorkflow('test-1');

    expect(result.finished).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should throw error when executing non-existent workflow', async () => {
    const engine = new WorkflowEngine();

    await expect(engine.executeWorkflow('non-existent')).rejects.toThrow(
      'not found',
    );
  });

  it('should throw error when executing inactive workflow', async () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: false,
      nodes: [
        {
          id: 'node-1',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
      connections: {},
    };

    engine.addWorkflow(workflow);

    await expect(engine.executeWorkflow('test-1')).rejects.toThrow(
      'not active',
    );
  });

  it('should throw error when node is not found in workflow', async () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {
            main: [[{ node: 'node-2', type: 'main', index: 0 }]],
          },
        },
      ],
      connections: {
        'node-1': [{ node: 'node-2', type: 'main', index: 0 }],
      },
    };

    engine.addWorkflow(workflow);

    await expect(engine.executeWorkflow('test-1')).rejects.toThrow(
      'not found in workflow',
    );
  });
});
