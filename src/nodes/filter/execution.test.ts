import { describe, it, expect } from 'vitest';
import { filterNodePlugin } from './index.js';
import type { WorkflowNode, TypedField } from '../../types.js';
import { toTypedFieldInput } from '../utils/to-typed-field-input.js';
import { extractTypedFieldResult } from '../utils/extract-typed-field-result.js';

describe('Filter Node - Execution', () => {
  it('should filter items in pass mode - keep matching items', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'active',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ status: 'active', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
      [{ status: 'active', name: 'item3' }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ status: 'active', name: 'item1' }],
      [],
      [{ status: 'active', name: 'item3' }],
    ]);
  });

  it('should filter items in drop mode - remove matching items', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'active',
          operator: 'equals',
        },
        mode: 'drop',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ status: 'active', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
      [{ status: 'active', name: 'item3' }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [],
      [{ status: 'inactive', name: 'item2' }],
      [],
    ]);
  });

  it('should use pass mode as default when mode is not specified', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'active',
          operator: 'equals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ status: 'active', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ status: 'active', name: 'item1' }],
      [],
    ]);
  });

  it('should filter with notEquals operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'inactive',
          operator: 'notEquals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ status: 'active', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
      [{ status: 'pending', name: 'item3' }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ status: 'active', name: 'item1' }],
      [],
      [{ status: 'pending', name: 'item3' }],
    ]);
  });

  it('should filter with contains operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'message',
          value: 'error',
          operator: 'contains',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ message: 'This is an error message', id: 1 }],
      [{ message: 'This is a success message', id: 2 }],
      [{ message: 'Another error occurred', id: 3 }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ message: 'This is an error message', id: 1 }],
      [],
      [{ message: 'Another error occurred', id: 3 }],
    ]);
  });

  it('should handle empty input', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'active',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input: TypedField[][] = [];
    const result = await filterNodePlugin.execute(node, input);

    expect(result['main']).toHaveLength(0);
  });

  it('should throw error when field is missing', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'missing',
          value: 'value',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ other: 'field' }],
      [{ missing: 'value' }],
    ]);
    await expect(filterNodePlugin.execute(node, input)).rejects.toThrow(
      'Field "missing" not found',
    );
  });

  it('should handle number field values', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'count',
          value: '5',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ count: 5 }],
      [{ count: 10 }],
      [{ count: 5 }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ count: 5 }],
      [],
      [{ count: 5 }],
    ]);
  });

  it('should handle boolean field values', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'enabled',
          value: 'true',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ enabled: true }],
      [{ enabled: false }],
      [{ enabled: true }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ enabled: true }],
      [],
      [{ enabled: true }],
    ]);
  });

  it('should preserve empty batches when all items are filtered out', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'active',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ status: 'inactive', name: 'item1' }],
      [{ status: 'pending', name: 'item2' }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([[], []]);
  });

  it('should keep all items when all match in drop mode', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'inactive',
          operator: 'equals',
        },
        mode: 'drop',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ status: 'active', name: 'item1' }],
      [{ status: 'pending', name: 'item2' }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ status: 'active', name: 'item1' }],
      [{ status: 'pending', name: 'item2' }],
    ]);
  });

  it('should filter on nested fields using dot notation', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.name',
          value: 'John',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { name: 'John', age: 30 }, id: 1 }],
      [{ user: { name: 'Jane', age: 25 }, id: 2 }],
      [{ user: { name: 'John', age: 35 }, id: 3 }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ user: { name: 'John', age: 30 }, id: 1 }],
      [],
      [{ user: { name: 'John', age: 35 }, id: 3 }],
    ]);
  });

  it('should filter on deeply nested fields', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.address.location.city',
          value: 'New York',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [
        {
          title: 'Item 1',
          user: {
            address: {
              location: { city: 'New York', country: 'USA' },
            },
          },
        },
      ],
      [
        {
          title: 'Item 2',
          user: {
            address: {
              location: { city: 'London', country: 'UK' },
            },
          },
        },
      ],
      [
        {
          title: 'Item 3',
          user: {
            address: {
              location: { city: 'New York', country: 'USA' },
            },
          },
        },
      ],
      [
        {
          title: 'Item 4',
          user: {
            address: {
              location: { city: 'Paris', country: 'France' },
            },
          },
        },
      ],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [
        {
          title: 'Item 1',
          user: {
            address: {
              location: { city: 'New York', country: 'USA' },
            },
          },
        },
      ],
      [],
      [
        {
          title: 'Item 3',
          user: {
            address: {
              location: { city: 'New York', country: 'USA' },
            },
          },
        },
      ],
      [],
    ]);
  });

  it('should throw error when nested field is missing', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.email',
          value: 'test@example.com',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { name: 'John' }, id: 1 }],
      [{ user: { name: 'Jane', email: 'test@example.com' }, id: 2 }],
      [{ id: 3 }],
    ]);
    await expect(filterNodePlugin.execute(node, input)).rejects.toThrow();
  });

  it('should throw error when null/undefined encountered in nested path', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.profile.name',
          value: 'John',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { profile: { name: 'John' } }, id: 1 }],
      [{ user: { profile: null }, id: 2 }],
      [{ user: null, id: 3 }],
      [{ id: 4 }],
    ]);
    await expect(filterNodePlugin.execute(node, input)).rejects.toThrow();
  });

  it('should filter on nested fields with contains operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'metadata.tags',
          value: 'important',
          operator: 'contains',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ metadata: { tags: 'important urgent' }, id: 1 }],
      [{ metadata: { tags: 'normal' }, id: 2 }],
      [{ metadata: { tags: 'important' }, id: 3 }],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ metadata: { tags: 'important urgent' }, id: 1 }],
      [],
      [{ metadata: { tags: 'important' }, id: 3 }],
    ]);
  });

  it('should filter all items in inner array, not just the first one', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Filter',
      type: 'builtIn.filter',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'active',
          operator: 'equals',
        },
        mode: 'pass',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [
        { status: 'active', name: 'item1' },
        { status: 'inactive', name: 'item2' },
        { status: 'active', name: 'item3' },
        { status: 'pending', name: 'item4' },
      ],
    ]);
    const result = await filterNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [
        { status: 'active', name: 'item1' },
        { status: 'active', name: 'item3' },
      ],
    ]);
  });
});
