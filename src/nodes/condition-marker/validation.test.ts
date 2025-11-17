import { describe, it, expect } from 'vitest';
import { conditionMarkerNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Condition Marker Node - Validation', () => {
  it('should throw error when condition marker node is missing condition parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Condition Marker',
      type: 'builtIn.conditionMarker',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    expect(() => {
      conditionMarkerNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when condition marker node has invalid condition parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Condition Marker',
      type: 'builtIn.conditionMarker',
      position: { x: 0, y: 0 },
      parameters: {
        condition: 'not-an-object',
      },
      connections: [],
    };

    expect(() => {
      conditionMarkerNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when condition marker node has missing condition fields', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Condition Marker',
      type: 'builtIn.conditionMarker',
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
      conditionMarkerNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when condition marker node has invalid operator', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Condition Marker',
      type: 'builtIn.conditionMarker',
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
      conditionMarkerNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should validate condition marker node with valid parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Condition Marker',
      type: 'builtIn.conditionMarker',
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
      conditionMarkerNodePlugin.validate(node);
    }).not.toThrow();
  });

  it('should validate condition marker node with custom field name', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Condition Marker',
      type: 'builtIn.conditionMarker',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'field1',
          value: 'value1',
          operator: 'equals',
        },
        field: 'isValid',
      },
      connections: [],
    };

    expect(() => {
      conditionMarkerNodePlugin.validate(node);
    }).not.toThrow();
  });

  it('should throw error when field name is empty string', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Condition Marker',
      type: 'builtIn.conditionMarker',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'field1',
          value: 'value1',
          operator: 'equals',
        },
        field: '',
      },
      connections: [],
    };

    expect(() => {
      conditionMarkerNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when field name is not a string', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Condition Marker',
      type: 'builtIn.conditionMarker',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'field1',
          value: 'value1',
          operator: 'equals',
        },
        field: 123,
      },
      connections: [],
    };

    expect(() => {
      conditionMarkerNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });
});
