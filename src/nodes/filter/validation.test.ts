import { describe, it, expect } from 'vitest';
import { filterNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Filter Node - Validation', () => {
  it('should throw error when filter node is missing condition parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    expect(() => {
      filterNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when filter node has invalid condition parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: 'not-an-object',
      },
      connections: [],
    };

    expect(() => {
      filterNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when filter node has missing condition fields', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
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
      filterNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when filter node has invalid operator', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
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
      filterNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when filter node has invalid mode', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'field1',
          value: 'value1',
          operator: 'equals',
        },
        mode: 'invalid-mode',
      },
      connections: [],
    };

    expect(() => {
      filterNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should validate filter node with valid parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
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
      filterNodePlugin.validate(node);
    }).not.toThrow();
  });

  it('should validate filter node with mode parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'field1',
          value: 'value1',
          operator: 'equals',
        },
        mode: 'drop',
      },
      connections: [],
    };

    expect(() => {
      filterNodePlugin.validate(node);
    }).not.toThrow();
  });
});
