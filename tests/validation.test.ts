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

  describe('Connection Validation', () => {
    it('should throw error when connection.node is missing', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              // @ts-expect-error - Testing invalid connection without node field
              main: [{ type: 'main', index: 0 }],
            },
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('expected string');
    });

    it('should throw error when connection.node is empty string', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: '', type: 'main', index: 0 }],
            },
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('node field is required and must be a non-empty string');
    });

    it('should throw error when connection.node is whitespace only', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: '   ', type: 'main', index: 0 }],
            },
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('node field cannot be empty');
    });

    it('should throw error when connection connects to non-existent node', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-2', type: 'main', index: 0 }],
            },
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('connects to non-existent node');
    });

    it('should throw error when node connects to itself', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-1', type: 'main', index: 0 }],
            },
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('cannot connect to itself');
    });

    it('should throw error when connection.type is missing', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              // @ts-expect-error - Testing invalid connection without type field
              main: [{ node: 'node-2', index: 0 }],
            },
          },
          {
            id: 'node-2',
            name: 'Set',
            type: 'builtIn.set',
            position: { x: 0, y: 0 },
            parameters: { values: [] },
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('expected string');
    });

    it('should throw error when connection.type is empty string', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-2', type: '', index: 0 }],
            },
          },
          {
            id: 'node-2',
            name: 'Set',
            type: 'builtIn.set',
            position: { x: 0, y: 0 },
            parameters: { values: [] },
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('type field is required and must be a non-empty string');
    });

    it('should throw error when connection.index is missing', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              // @ts-expect-error - Testing invalid connection without index field
              main: [{ node: 'node-2', type: 'main' }],
            },
          },
          {
            id: 'node-2',
            name: 'Set',
            type: 'builtIn.set',
            position: { x: 0, y: 0 },
            parameters: { values: [] },
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('expected number');
    });

    it('should throw error when connection.index is negative', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-2', type: 'main', index: -1 }],
            },
          },
          {
            id: 'node-2',
            name: 'Set',
            type: 'builtIn.set',
            position: { x: 0, y: 0 },
            parameters: { values: [] },
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('index must be a non-negative integer');
    });

    it('should throw error when connection.index is not an integer', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-2', type: 'main', index: 1.5 }],
            },
          },
          {
            id: 'node-2',
            name: 'Set',
            type: 'builtIn.set',
            position: { x: 0, y: 0 },
            parameters: { values: [] },
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('index must be an integer');
    });

    it('should throw error when connections is not an array', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              // @ts-expect-error - Testing invalid connections structure (not an array)
              main: { node: 'node-2', type: 'main', index: 0 },
            },
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('expected array');
    });

    it('should accept valid connections', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Start',
            type: 'builtIn.start',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-2', type: 'main', index: 0 }],
            },
          },
          {
            id: 'node-2',
            name: 'Set',
            type: 'builtIn.set',
            position: { x: 0, y: 0 },
            parameters: { values: [] },
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).not.toThrow();
    });
  });
});
