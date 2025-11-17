import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/engine.js';
import type { Workflow, WorkflowNode, Connection } from '../src/types.js';

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
    }).toThrow('invalid type');
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
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              // @ts-expect-error - Testing invalid connection without node field
              main: [{ outputPort: 'main' }],
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
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: '', outputPort: 'main' }],
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
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: '   ', outputPort: 'main' }],
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
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-2', outputPort: 'main' }],
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
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-1', outputPort: 'main' }],
            },
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('cannot connect to itself');
    });

    it('should throw error when connection.outputPort is missing', () => {
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
            connections: {
              // @ts-expect-error - Testing invalid connection without outputPort field
              main: [{ node: 'node-2' }],
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

    it('should throw error when connection.outputPort is missing', () => {
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
            connections: {
              // @ts-expect-error - Testing invalid connection without outputPort field
              main: [{ node: 'node-2' }],
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

    it('should throw error when connection.outputPort is empty string', () => {
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
            connections: {
              main: [{ node: 'node-2', outputPort: '' }],
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
      }).toThrow('outputPort field is required and must be a non-empty string');
    });

    it('should throw error when connection.outputPort is whitespace only', () => {
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
            connections: {
              main: [{ node: 'node-2', outputPort: '   ' }],
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
      }).toThrow('outputPort field cannot be empty');
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
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              // @ts-expect-error - Testing invalid connections structure (not an array)
              main: { node: 'node-2', outputPort: 'main' },
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
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-2', outputPort: 'main' }],
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

  describe('ID Format Validation', () => {
    it('should throw error when workflow ID contains invalid characters', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'invalid@id',
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

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Workflow ID must contain only alphanumeric characters');
    });

    it('should throw error when workflow ID is too long', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'a'.repeat(101),
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

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Workflow ID must be 100 characters or less');
    });

    it('should throw error when node ID contains invalid characters', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node@1',
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Node ID must contain only alphanumeric characters');
    });

    it('should throw error when node ID is too long', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'a'.repeat(101),
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Node ID must be 100 characters or less');
    });

    it('should accept valid IDs with dashes and underscores', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-workflow_123',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1_test',
            name: 'Noop',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).not.toThrow();
    });
  });

  describe('Name Length Validation', () => {
    it('should throw error when workflow name is too long', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'a'.repeat(201),
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

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Workflow name must be 200 characters or less');
    });

    it('should throw error when node name is too long', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'a'.repeat(201),
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Node name must be 200 characters or less');
    });

    it('should accept names at maximum length', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'a'.repeat(200),
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'b'.repeat(200),
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {},
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).not.toThrow();
    });
  });

  describe('Maximum Limits Validation', () => {
    it('should throw error when workflow has too many nodes', () => {
      const engine = new WorkflowEngine();
      const nodes = Array.from({ length: 1001 }, (_, i) => ({
        id: `node-${i}`,
        name: 'Noop',
        type: 'builtIn.noop',
        position: { x: 0, y: 0 },
        parameters: {},
        connections: {},
      }));

      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes,
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Workflow cannot have more than 1000 nodes');
    });

    it('should throw error when workflow has too many connections', () => {
      const engine = new WorkflowEngine();
      const nodes: WorkflowNode[] = [];

      // Create 101 nodes (need 101 to create 10001 connections)
      for (let i = 0; i < 101; i++) {
        nodes.push({
          id: `node-${i}`,
          name: 'Noop',
          type: 'builtIn.noop',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        });
      }

      // Add 10001 connections
      // First 100 nodes each connect to all 101 nodes (excluding self) = 100 * 100 = 10,000
      // Then add 1 more connection to exceed limit
      for (let i = 0; i < 100; i++) {
        const node = nodes[i];
        if (!node) continue;
        const connections: Connection[] = [];
        for (let j = 0; j < 101; j++) {
          if (j !== i) {
            connections.push({
              node: `node-${j}`,
              outputPort: 'main',
            });
          }
        }
        node.connections = { main: connections };
      }
      // Add one more connection to node-100 from node-0 to exceed limit
      const node0Connections = nodes[0]?.connections['main'];
      if (node0Connections) {
        node0Connections.push({
          node: 'node-100',
          outputPort: 'main',
        });
      }

      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes,
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Workflow cannot have more than 10000 connections');
    });

    it('should accept workflows at maximum limits', () => {
      const engine = new WorkflowEngine();
      const nodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i}`,
        name: 'Noop',
        type: 'builtIn.noop',
        position: { x: 0, y: 0 },
        parameters: {},
        connections: {},
      }));

      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes,
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).not.toThrow();
    });
  });

  describe('Duplicate Connection Validation', () => {
    it('should throw error when duplicate connection exists', () => {
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
            connections: {
              main: [
                { node: 'node-2', outputPort: 'main' },
                { node: 'node-2', outputPort: 'main' }, // Duplicate
              ],
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
      }).toThrow('Duplicate connection');
    });

    it('should allow different connections to same node with different output ports', () => {
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
            connections: {
              main: [
                { node: 'node-2', outputPort: 'main' },
                { node: 'node-2', outputPort: 'secondary' }, // Different output port
              ],
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

    it('should allow same connection from different output ports', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'If',
            type: 'builtIn.if',
            position: { x: 0, y: 0 },
            parameters: {
              condition: {
                path: 'test',
                value: 'value',
                operator: 'equals',
              },
            },
            connections: {
              true: [{ node: 'node-2', outputPort: 'main' }],
              false: [{ node: 'node-2', outputPort: 'main' }], // Same target, different port
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

  describe('Unreachable Nodes Validation', () => {
    it('should throw error when node is unreachable', () => {
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
            connections: {
              main: [{ node: 'node-2', outputPort: 'main' }],
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
          {
            id: 'node-3',
            name: 'Unreachable',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-4', outputPort: 'main' }],
            },
          },
          {
            id: 'node-4',
            name: 'Also Unreachable',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-3', outputPort: 'main' }],
            },
          },
        ],
      };

      expect(() => {
        engine.addWorkflow(workflow);
      }).toThrow('Unreachable nodes detected');
    });

    it('should accept workflow where all nodes have incoming connections', () => {
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
            connections: {
              main: [{ node: 'node-2', outputPort: 'main' }],
            },
          },
          {
            id: 'node-2',
            name: 'Set',
            type: 'builtIn.set',
            position: { x: 0, y: 0 },
            parameters: { values: [] },
            connections: {
              main: [{ node: 'node-1', outputPort: 'main' }],
            },
          },
        ],
      };

      // This is valid - nodes can execute with input data provided externally
      // or nodes without incoming connections can execute with empty input
      expect(() => {
        engine.addWorkflow(workflow);
      }).not.toThrow();
    });

    it('should accept workflow with all nodes reachable', () => {
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
            connections: {
              main: [{ node: 'node-2', outputPort: 'main' }],
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

    it('should accept workflow with multiple entry points', () => {
      const engine = new WorkflowEngine();
      const workflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        active: true,
        nodes: [
          {
            id: 'node-1',
            name: 'Noop 1',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-3', outputPort: 'main' }],
            },
          },
          {
            id: 'node-2',
            name: 'Noop 2',
            type: 'builtIn.noop',
            position: { x: 0, y: 0 },
            parameters: {},
            connections: {
              main: [{ node: 'node-3', outputPort: 'main' }],
            },
          },
          {
            id: 'node-3',
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
