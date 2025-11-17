import { describe, it, expect } from 'vitest';
import { switchNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Switch Node - Validation', () => {
  it('should throw error when switch node is missing rules parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when switch node has invalid rules parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: 'not-an-array',
      },
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when switch node has empty rules array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [],
      },
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when switch node has invalid rule condition', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: 'not-an-object',
            output: 'high',
          },
        ],
      },
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when switch node has missing output in rule', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'priority',
              value: 'high',
              operator: 'equals',
            },
          },
        ],
      },
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when switch node has empty output port name', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'priority',
              value: 'high',
              operator: 'equals',
            },
            output: '',
          },
        ],
      },
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when switch node has duplicate output port names', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'priority',
              value: 'high',
              operator: 'equals',
            },
            output: 'high',
          },
          {
            condition: {
              path: 'status',
              value: 'active',
              operator: 'equals',
            },
            output: 'high', // Duplicate
          },
        ],
      },
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).toThrow('Duplicate output port name');
  });

  it('should validate switch node with valid parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'priority',
              value: 'high',
              operator: 'equals',
            },
            output: 'high',
          },
          {
            condition: {
              path: 'priority',
              value: 'medium',
              operator: 'equals',
            },
            output: 'medium',
          },
        ],
        defaultOutput: 'low',
      },
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).not.toThrow();
  });

  it('should validate switch node with default defaultOutput', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'priority',
              value: 'high',
              operator: 'equals',
            },
            output: 'high',
          },
        ],
      },
      connections: [],
    };

    expect(() => {
      switchNodePlugin.validate(node);
    }).not.toThrow();
  });
});
