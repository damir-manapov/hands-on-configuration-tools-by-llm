import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/engine.js';
import type { Workflow } from '../src/types.js';

describe('WorkflowEngine', () => {
  it('should add and retrieve workflow', () => {
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
    const retrieved = engine.getWorkflow('test-1');

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe('test-1');
    expect(retrieved.name).toBe('Test Workflow');
  });

  it('should throw error when adding duplicate workflow', () => {
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

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('already exists');
  });

  it('should remove workflow', () => {
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
    engine.removeWorkflow('test-1');

    expect(() => {
      engine.getWorkflow('test-1');
    }).toThrow('not found');
  });

  it('should list all workflows', () => {
    const engine = new WorkflowEngine();
    const workflow1: Workflow = {
      id: 'test-1',
      name: 'Test Workflow 1',
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

    const workflow2: Workflow = {
      id: 'test-2',
      name: 'Test Workflow 2',
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

    engine.addWorkflow(workflow1);
    engine.addWorkflow(workflow2);

    const workflows = engine.listWorkflows();

    expect(workflows).toHaveLength(2);
    expect(workflows.map((w) => w.id)).toContain('test-1');
    expect(workflows.map((w) => w.id)).toContain('test-2');
  });

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

  it('should throw error when getting non-existent workflow', () => {
    const engine = new WorkflowEngine();

    expect(() => {
      engine.getWorkflow('non-existent');
    }).toThrow('not found');
  });

  it('should throw error when removing non-existent workflow', () => {
    const engine = new WorkflowEngine();

    expect(() => {
      engine.removeWorkflow('non-existent');
    }).toThrow('not found');
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
      connections: {},
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
      connections: {},
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('must have a type');
  });

  it('should throw error when set node is missing values parameter', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Set Node',
          type: 'n8n-nodes-base.set',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
      connections: {},
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when set node has invalid values parameter', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Set Node',
          type: 'n8n-nodes-base.set',
          position: { x: 0, y: 0 },
          parameters: {
            values: 'not-an-array',
          },
          connections: {},
        },
      ],
      connections: {},
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when set node has invalid value item', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Set Node',
          type: 'n8n-nodes-base.set',
          position: { x: 0, y: 0 },
          parameters: {
            values: [{ name: 123, value: 'test' }],
          },
          connections: {},
        },
      ],
      connections: {},
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node is missing conditions parameter', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'If Node',
          type: 'n8n-nodes-base.if',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
      connections: {},
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has invalid conditions parameter', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'If Node',
          type: 'n8n-nodes-base.if',
          position: { x: 0, y: 0 },
          parameters: {
            conditions: 'not-an-object',
          },
          connections: {},
        },
      ],
      connections: {},
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has missing condition fields', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'If Node',
          type: 'n8n-nodes-base.if',
          position: { x: 0, y: 0 },
          parameters: {
            conditions: {
              leftValue: 'field1',
              rightValue: 'value1',
            },
          },
          connections: {},
        },
      ],
      connections: {},
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has invalid operator', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'If Node',
          type: 'n8n-nodes-base.if',
          position: { x: 0, y: 0 },
          parameters: {
            conditions: {
              leftValue: 'field1',
              rightValue: 'value1',
              operator: 'invalid-operator',
            },
          },
          connections: {},
        },
      ],
      connections: {},
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('has invalid parameters');
  });
});
