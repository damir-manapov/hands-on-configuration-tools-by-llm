import { describe, it, expect } from 'vitest';
import { ifNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('If Node - Validation', () => {
  it('should throw error when if node is missing condition parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    expect(() => {
      ifNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has invalid condition parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: 'not-an-object',
      },
      connections: [],
    };

    expect(() => {
      ifNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has missing condition fields', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'field1',
          value: 'value1',
        },
      },
      connections: [],
    };

    expect(() => {
      ifNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when if node has invalid operator', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'field1',
          value: 'value1',
          operator: 'invalid-operator',
        },
      },
      connections: [],
    };

    expect(() => {
      ifNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should validate if node with valid parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'field1',
          value: 'value1',
          operator: 'equals',
        },
      },
      connections: [],
    };

    expect(() => {
      ifNodePlugin.validate(node);
    }).not.toThrow();
  });
});
