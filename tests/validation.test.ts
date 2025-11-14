import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/engine.js';
import type { Workflow } from '../src/types.js';

describe('WorkflowEngine - Validation', () => {
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
