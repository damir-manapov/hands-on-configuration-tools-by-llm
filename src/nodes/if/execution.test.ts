import { describe, it, expect } from 'vitest';
import type { WorkflowNode } from '../../types.js';
import { ifNodePlugin } from './index.js';
import { toTypedFieldInput } from '../utils/to-typed-field-input.js';
import { extractTypedFieldResult } from '../utils/extract-typed-field-result.js';

describe('If Node - Execution', () => {
  it('should execute if node with equals operator - match', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
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

    const input = toTypedFieldInput([[{ status: 'active', name: 'test' }]]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ status: 'active', name: 'test', _matched: true }],
    ]);
  });

  it('should execute if node with equals operator - no match', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
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

    const input = toTypedFieldInput([[{ status: 'inactive', name: 'test' }]]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ status: 'inactive', name: 'test', _matched: false }],
    ]);
  });

  it('should execute if node with notEquals operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'status',
          value: 'active',
          operator: 'notEquals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ status: 'inactive' }]]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ status: 'inactive', _matched: true }],
    ]);
  });

  it('should execute if node with contains operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'message',
          value: 'error',
          operator: 'contains',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ message: 'This is an error message' }],
    ]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ message: 'This is an error message', _matched: true }],
    ]);
  });

  it('should execute if node with contains operator - no match', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'message',
          value: 'error',
          operator: 'contains',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ message: 'This is a success message' }],
    ]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ message: 'This is a success message', _matched: false }],
    ]);
  });

  it('should throw error when field is missing', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'missing',
          value: 'value',
          operator: 'equals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ other: 'field' }]]);
    await expect(ifNodePlugin.execute(node, input)).rejects.toThrow(
      'Field "missing" not found',
    );
  });

  it('should execute if node with number field value', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'count',
          value: '5',
          operator: 'equals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ count: 5 }]]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ count: 5, _matched: true }],
    ]);
  });

  it('should execute if node with boolean field value', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'enabled',
          value: 'true',
          operator: 'equals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ enabled: true }]]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ enabled: true, _matched: true }],
    ]);
  });

  it('should execute if node with multiple input items', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
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
      [{ status: 'active' }],
      [{ status: 'inactive' }],
      [{ status: 'active' }],
    ]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ status: 'active', _matched: true }],
      [{ status: 'inactive', _matched: false }],
      [{ status: 'active', _matched: true }],
    ]);
  });

  it('should process all items in inner array, not just the first one', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
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
      [
        { status: 'active', name: 'item1' },
        { status: 'inactive', name: 'item2' },
        { status: 'active', name: 'item3' },
      ],
    ]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [
        { status: 'active', name: 'item1', _matched: true },
        { status: 'inactive', name: 'item2', _matched: false },
        { status: 'active', name: 'item3', _matched: true },
      ],
    ]);
  });

  it('should execute if node with nested fields using dot notation', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.name',
          value: 'John',
          operator: 'equals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { name: 'John', age: 30 }, id: 1 }],
      [{ user: { name: 'Jane', age: 25 }, id: 2 }],
      [{ user: { name: 'John', age: 35 }, id: 3 }],
    ]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ user: { name: 'John', age: 30 }, id: 1, _matched: true }],
      [{ user: { name: 'Jane', age: 25 }, id: 2, _matched: false }],
      [{ user: { name: 'John', age: 35 }, id: 3, _matched: true }],
    ]);
  });

  it('should execute if node with deeply nested fields', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.address.location.city',
          value: 'New York',
          operator: 'equals',
        },
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
    ]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [
        {
          title: 'Item 1',
          user: {
            address: {
              location: { city: 'New York', country: 'USA' },
            },
          },
          _matched: true,
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
          _matched: false,
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
          _matched: true,
        },
      ],
    ]);
  });

  it('should throw error when nested field is missing', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.email',
          value: 'test@example.com',
          operator: 'equals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { name: 'John' }, id: 1 }],
      [{ user: { name: 'Jane', email: 'test@example.com' }, id: 2 }],
      [{ id: 3 }],
    ]);
    await expect(ifNodePlugin.execute(node, input)).rejects.toThrow();
  });

  it('should throw error when null/undefined encountered in nested path', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.profile.name',
          value: 'John',
          operator: 'equals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { profile: { name: 'John' } }, id: 1 }],
      [{ user: { profile: null }, id: 2 }],
      [{ user: null, id: 3 }],
      [{ id: 4 }],
    ]);
    await expect(ifNodePlugin.execute(node, input)).rejects.toThrow();
  });

  it('should execute if node with nested fields using contains operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'metadata.tags',
          value: 'important',
          operator: 'contains',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ metadata: { tags: 'important urgent' }, id: 1 }],
      [{ metadata: { tags: 'normal' }, id: 2 }],
      [{ metadata: { tags: 'important' }, id: 3 }],
    ]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ metadata: { tags: 'important urgent' }, id: 1, _matched: true }],
      [{ metadata: { tags: 'normal' }, id: 2, _matched: false }],
      [{ metadata: { tags: 'important' }, id: 3, _matched: true }],
    ]);
  });

  it('should execute if node with nested fields using notEquals operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.role',
          value: 'admin',
          operator: 'notEquals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { role: 'user', name: 'John' }, id: 1 }],
      [{ user: { role: 'admin', name: 'Jane' }, id: 2 }],
      [{ user: { role: 'moderator', name: 'Bob' }, id: 3 }],
    ]);
    const result = await ifNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result)).toEqual([
      [{ user: { role: 'user', name: 'John' }, id: 1, _matched: true }],
      [{ user: { role: 'admin', name: 'Jane' }, id: 2, _matched: false }],
      [{ user: { role: 'moderator', name: 'Bob' }, id: 3, _matched: true }],
    ]);
  });
});
