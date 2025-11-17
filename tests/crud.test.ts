import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/engine.js';
import type { Workflow } from '../src/types.js';

describe('WorkflowEngine - CRUD Operations', () => {
  it('should add and retrieve workflow', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Noop',
          type: 'builtIn.noop',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
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
          name: 'Noop',
          type: 'builtIn.noop',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
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
          name: 'Noop',
          type: 'builtIn.noop',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
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
          name: 'Noop',
          type: 'builtIn.noop',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
    };

    const workflow2: Workflow = {
      id: 'test-2',
      name: 'Test Workflow 2',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Noop',
          type: 'builtIn.noop',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
    };

    engine.addWorkflow(workflow1);
    engine.addWorkflow(workflow2);

    const workflows = engine.listWorkflows();

    expect(workflows).toHaveLength(2);
    expect(workflows.map((w) => w.id)).toContain('test-1');
    expect(workflows.map((w) => w.id)).toContain('test-2');
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
});
