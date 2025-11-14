import { describe, it, expect } from 'vitest';
import { filterNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Filter Node - Execution', () => {
  it('should filter items in pass mode - keep matching items', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: {},
    };

    const input = [
      [{ status: 'active', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
      [{ status: 'active', name: 'item3' }],
    ];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(2);
    expect(result[0]?.[0]).toEqual({ status: 'active', name: 'item1' });
    expect(result[1]?.[0]).toEqual({ status: 'active', name: 'item3' });
  });

  it('should filter items in drop mode - remove matching items', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'equals',
        },
        mode: 'drop',
      },
      connections: {},
    };

    const input = [
      [{ status: 'active', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
      [{ status: 'active', name: 'item3' }],
    ];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(1);
    expect(result[0]?.[0]).toEqual({ status: 'inactive', name: 'item2' });
  });

  it('should use pass mode as default when mode is not specified', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'equals',
        },
      },
      connections: {},
    };

    const input = [
      [{ status: 'active', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
    ];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(1);
    expect(result[0]?.[0]).toEqual({ status: 'active', name: 'item1' });
  });

  it('should filter with notEquals operator', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'status',
          rightValue: 'inactive',
          operator: 'notEquals',
        },
        mode: 'pass',
      },
      connections: {},
    };

    const input = [
      [{ status: 'active', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
      [{ status: 'pending', name: 'item3' }],
    ];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(2);
    expect(result[0]?.[0]).toEqual({ status: 'active', name: 'item1' });
    expect(result[1]?.[0]).toEqual({ status: 'pending', name: 'item3' });
  });

  it('should filter with contains operator', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'message',
          rightValue: 'error',
          operator: 'contains',
        },
        mode: 'pass',
      },
      connections: {},
    };

    const input = [
      [{ message: 'This is an error message', id: 1 }],
      [{ message: 'This is a success message', id: 2 }],
      [{ message: 'Another error occurred', id: 3 }],
    ];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(2);
    expect(result[0]?.[0]).toEqual({
      message: 'This is an error message',
      id: 1,
    });
    expect(result[1]?.[0]).toEqual({
      message: 'Another error occurred',
      id: 3,
    });
  });

  it('should handle empty input', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: {},
    };

    const input: unknown[][] = [];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(0);
  });

  it('should handle missing field in pass mode', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'missing',
          rightValue: 'value',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: {},
    };

    const input = [[{ other: 'field' }], [{ missing: 'value' }]];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(1);
    expect(result[0]?.[0]).toEqual({ missing: 'value' });
  });

  it('should handle number field values', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'count',
          rightValue: '5',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: {},
    };

    const input = [[{ count: 5 }], [{ count: 10 }], [{ count: 5 }]];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(2);
    expect(result[0]?.[0]).toEqual({ count: 5 });
    expect(result[1]?.[0]).toEqual({ count: 5 });
  });

  it('should handle boolean field values', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'enabled',
          rightValue: 'true',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: {},
    };

    const input = [
      [{ enabled: true }],
      [{ enabled: false }],
      [{ enabled: true }],
    ];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(2);
    expect(result[0]?.[0]).toEqual({ enabled: true });
    expect(result[1]?.[0]).toEqual({ enabled: true });
  });

  it('should filter all items out when none match in pass mode', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'status',
          rightValue: 'active',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: {},
    };

    const input = [
      [{ status: 'inactive', name: 'item1' }],
      [{ status: 'pending', name: 'item2' }],
    ];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(0);
  });

  it('should keep all items when all match in drop mode', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          leftValue: 'status',
          rightValue: 'inactive',
          operator: 'equals',
        },
        mode: 'drop',
      },
      connections: {},
    };

    const input = [
      [{ status: 'active', name: 'item1' }],
      [{ status: 'pending', name: 'item2' }],
    ];
    const result = filterNodePlugin.execute(node, input) as unknown[][];

    expect(result).toHaveLength(2);
    expect(result[0]?.[0]).toEqual({ status: 'active', name: 'item1' });
    expect(result[1]?.[0]).toEqual({ status: 'pending', name: 'item2' });
  });
});
