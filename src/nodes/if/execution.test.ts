import { describe, it, expect } from 'vitest';
import type { WorkflowNode, TypedField } from '../../types.js';
import { ifNodePlugin } from './index.js';
import { toTypedFieldInput } from '../utils/to-typed-field-input.js';
import { extractTypedFieldResult } from '../utils/extract-typed-field-result.js';

describe('If Node - Execution', () => {
  it('should route matching items to true port and non-matching to false port', async () => {
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

    expect({
      true: extractTypedFieldResult(result['true']!),
      false: extractTypedFieldResult(result['false']!),
    }).toEqual({
      true: [[{ status: 'active' }], [{ status: 'active' }]],
      false: [[{ status: 'inactive' }]],
    });
  });

  it('should route all items to false port when none match', async () => {
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
      [{ status: 'inactive' }],
      [{ status: 'pending' }],
    ]);

    const result = await ifNodePlugin.execute(node, input);

    expect({
      true: extractTypedFieldResult(result['true']!),
      false: extractTypedFieldResult(result['false']!),
    }).toEqual({
      true: [],
      false: [[{ status: 'inactive' }], [{ status: 'pending' }]],
    });
  });

  it('should route all items to true port when all match', async () => {
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
      [{ status: 'active' }],
    ]);

    const result = await ifNodePlugin.execute(node, input);

    expect({
      true: extractTypedFieldResult(result['true']!),
      false: extractTypedFieldResult(result['false']!),
    }).toEqual({
      true: [[{ status: 'active' }], [{ status: 'active' }]],
      false: [],
    });
  });

  it('should handle empty input', async () => {
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

    const input: TypedField[][] = [];

    const result = await ifNodePlugin.execute(node, input);

    expect(result['true']).toEqual([]);
    expect(result['false']).toEqual([]);
  });

  it('should handle nested field paths', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'user.email',
          value: '@example.com',
          operator: 'contains',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { email: 'test@example.com' } }],
      [{ user: { email: 'other@test.com' } }],
    ]);

    const result = await ifNodePlugin.execute(node, input);

    expect({
      true: extractTypedFieldResult(result['true']!),
      false: extractTypedFieldResult(result['false']!),
    }).toEqual({
      true: [[{ user: { email: 'test@example.com' } }]],
      false: [[{ user: { email: 'other@test.com' } }]],
    });
  });

  it('should handle notEquals operator', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'If',
      type: 'builtIn.if',
      position: { x: 0, y: 0 },
      parameters: {
        condition: {
          path: 'priority',
          value: 'low',
          operator: 'notEquals',
        },
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ priority: 'high' }],
      [{ priority: 'low' }],
      [{ priority: 'medium' }],
    ]);

    const result = await ifNodePlugin.execute(node, input);

    expect({
      true: extractTypedFieldResult(result['true']!),
      false: extractTypedFieldResult(result['false']!),
    }).toEqual({
      true: [[{ priority: 'high' }], [{ priority: 'medium' }]],
      false: [[{ priority: 'low' }]],
    });
  });

  it('should throw error when input field is null', async () => {
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

    const input: null[][] = [[null]];

    await expect(ifNodePlugin.execute(node, input as never)).rejects.toThrow(
      'received undefined or null input field',
    );
  });
});
