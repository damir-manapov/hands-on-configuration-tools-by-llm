import { describe, it, expect } from 'vitest';
import type { WorkflowNode, TypedField } from '../../types.js';
import { switchNodePlugin } from './index.js';
import { toTypedFieldInput } from '../utils/to-typed-field-input.js';
import { extractTypedFieldResult } from '../utils/extract-typed-field-result.js';

describe('Switch Node - Execution', () => {
  it('should route items to correct output ports based on rules', async () => {
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

    const input = toTypedFieldInput([
      [{ priority: 'high', name: 'item1' }],
      [{ priority: 'medium', name: 'item2' }],
      [{ priority: 'low', name: 'item3' }],
    ]);

    const result = await switchNodePlugin.execute(node, input);

    expect({
      high: extractTypedFieldResult(result['high']!),
      medium: extractTypedFieldResult(result['medium']!),
      low: extractTypedFieldResult(result['low']!),
    }).toEqual({
      high: [[{ priority: 'high', name: 'item1' }]],
      medium: [[{ priority: 'medium', name: 'item2' }]],
      low: [[{ priority: 'low', name: 'item3' }]],
    });
  });

  it('should route items to default output when no rules match', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'status',
              value: 'active',
              operator: 'equals',
            },
            output: 'active',
          },
        ],
        defaultOutput: 'inactive',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ status: 'pending', name: 'item1' }],
      [{ status: 'inactive', name: 'item2' }],
    ]);

    const result = await switchNodePlugin.execute(node, input);

    expect({
      active: extractTypedFieldResult(result['active']!),
      inactive: extractTypedFieldResult(result['inactive']!),
    }).toEqual({
      active: [],
      inactive: [
        [{ status: 'pending', name: 'item1' }],
        [{ status: 'inactive', name: 'item2' }],
      ],
    });
  });

  it('should use first matching rule when multiple rules could match', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'status',
              value: 'active',
              operator: 'equals',
            },
            output: 'first',
          },
          {
            condition: {
              path: 'status',
              value: 'active',
              operator: 'equals',
            },
            output: 'second',
          },
        ],
        defaultOutput: 'default',
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ status: 'active', name: 'item1' }]]);

    const result = await switchNodePlugin.execute(node, input);

    expect({
      first: extractTypedFieldResult(result['first']!),
      second: extractTypedFieldResult(result['second']!),
      default: extractTypedFieldResult(result['default']!),
    }).toEqual({
      first: [[{ status: 'active', name: 'item1' }]],
      second: [],
      default: [],
    });
  });

  it('should handle empty input', async () => {
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
        defaultOutput: 'low',
      },
      connections: [],
    };

    const input: TypedField[][] = [];

    const result = await switchNodePlugin.execute(node, input);

    expect(result['high']).toEqual([]);
    expect(result['low']).toEqual([]);
  });

  it('should handle nested field paths', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'user.email',
              value: '@example.com',
              operator: 'contains',
            },
            output: 'internal',
          },
        ],
        defaultOutput: 'external',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { email: 'test@example.com' }, name: 'item1' }],
      [{ user: { email: 'other@test.com' }, name: 'item2' }],
    ]);

    const result = await switchNodePlugin.execute(node, input);

    expect({
      internal: extractTypedFieldResult(result['internal']!),
      external: extractTypedFieldResult(result['external']!),
    }).toEqual({
      internal: [[{ user: { email: 'test@example.com' }, name: 'item1' }]],
      external: [[{ user: { email: 'other@test.com' }, name: 'item2' }]],
    });
  });

  it('should handle multiple items in same batch routing to different outputs', async () => {
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

    const input = toTypedFieldInput([
      [
        { priority: 'high', name: 'item1' },
        { priority: 'medium', name: 'item2' },
        { priority: 'low', name: 'item3' },
      ],
    ]);

    const result = await switchNodePlugin.execute(node, input);

    expect({
      high: extractTypedFieldResult(result['high']!),
      medium: extractTypedFieldResult(result['medium']!),
      low: extractTypedFieldResult(result['low']!),
    }).toEqual({
      high: [[{ priority: 'high', name: 'item1' }]],
      medium: [[{ priority: 'medium', name: 'item2' }]],
      low: [[{ priority: 'low', name: 'item3' }]],
    });
  });

  it('should use default defaultOutput when not specified', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'status',
              value: 'active',
              operator: 'equals',
            },
            output: 'active',
          },
        ],
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ status: 'inactive', name: 'item1' }]]);

    const result = await switchNodePlugin.execute(node, input);

    expect({
      active: extractTypedFieldResult(result['active']!),
      default: extractTypedFieldResult(result['default']!),
    }).toEqual({
      active: [],
      default: [[{ status: 'inactive', name: 'item1' }]],
    });
  });

  it('should throw error when input field is null', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Switch',
      type: 'builtIn.switch',
      position: { x: 0, y: 0 },
      parameters: {
        rules: [
          {
            condition: {
              path: 'status',
              value: 'active',
              operator: 'equals',
            },
            output: 'active',
          },
        ],
        defaultOutput: 'inactive',
      },
      connections: [],
    };

    const input: null[][] = [[null]];

    await expect(
      switchNodePlugin.execute(node, input as never),
    ).rejects.toThrow('received undefined or null input field');
  });

  it('should handle notEquals operator', async () => {
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
              value: 'low',
              operator: 'notEquals',
            },
            output: 'notLow',
          },
        ],
        defaultOutput: 'low',
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ priority: 'high', name: 'item1' }],
      [{ priority: 'low', name: 'item2' }],
    ]);

    const result = await switchNodePlugin.execute(node, input);

    expect({
      notLow: extractTypedFieldResult(result['notLow']!),
      low: extractTypedFieldResult(result['low']!),
    }).toEqual({
      notLow: [[{ priority: 'high', name: 'item1' }]],
      low: [[{ priority: 'low', name: 'item2' }]],
    });
  });
});
