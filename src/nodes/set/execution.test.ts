import { describe, it, expect } from 'vitest';
import type { WorkflowNode } from '../../types.js';
import type { TypedField } from '../../types.js';
import { setNodePlugin } from './index.js';
import { toTypedFieldInput } from '../utils/to-typed-field-input.js';
import { extractTypedFieldResult } from '../utils/extract-typed-field-result.js';
import { NodeExecutionError } from '../../errors/index.js';

describe('Set Node - Execution', () => {
  it('should execute set node and add values', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [
          { path: 'field1', value: 'value1' },
          { path: 'field2', value: 'value2' },
        ],
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ existing: 'data' }]]);
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(extractTypedFieldResult(result)).toEqual([
      [{ existing: 'data', field1: 'value1', field2: 'value2' }],
    ]);
  });

  it('should execute set node with empty values array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [],
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ existing: 'data' }]]);
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(extractTypedFieldResult(result)).toEqual([[{ existing: 'data' }]]);
  });

  it('should execute set node with multiple input items', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'added', value: 'value' }],
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ item1: 'data1' }],
      [{ item2: 'data2' }],
    ]);
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(extractTypedFieldResult(result)).toEqual([
      [{ item1: 'data1', added: 'value' }],
      [{ item2: 'data2', added: 'value' }],
    ]);
  });

  it('should execute set node and overwrite existing fields', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'field1', value: 'new-value' }],
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ field1: 'old-value', field2: 'keep' }],
    ]);
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(extractTypedFieldResult(result)).toEqual([
      [{ field1: 'new-value', field2: 'keep' }],
    ]);
  });

  it('should process all items in inner array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'added', value: 'value' }],
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ item1: 'data1' }, { item2: 'data2' }, { item3: 'data3' }],
    ]);
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(extractTypedFieldResult(result)).toEqual([
      [
        { item1: 'data1', added: 'value' },
        { item2: 'data2', added: 'value' },
        { item3: 'data3', added: 'value' },
      ],
    ]);
  });

  it('should throw NodeExecutionError when inputField is missing', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'field1', value: 'value1' }],
      },
      connections: [],
    };

    const input: TypedField[][] = [[undefined as unknown as TypedField]];
    const executeFn = () => setNodePlugin.execute(node, input);
    expect(executeFn).toThrow(NodeExecutionError);
    expect(executeFn).toThrow('Set node requires a TypedField input');
  });

  it('should throw NodeExecutionError when inputField.value is null', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'field1', value: 'value1' }],
      },
      connections: [],
    };

    const input: TypedField[][] = [[{ value: null, kind: 'primitive' }]];
    const executeFn = () => setNodePlugin.execute(node, input);
    expect(executeFn).toThrow(NodeExecutionError);
    expect(executeFn).toThrow('Set node requires input value to be an object');
  });

  it('should throw NodeExecutionError when inputField.value is undefined', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'field1', value: 'value1' }],
      },
      connections: [],
    };

    const input: TypedField[][] = [[{ value: undefined, kind: 'primitive' }]];
    const executeFn = () => setNodePlugin.execute(node, input);
    expect(executeFn).toThrow(NodeExecutionError);
    expect(executeFn).toThrow('Set node requires input value to be an object');
  });

  it('should throw NodeExecutionError when inputField.value is a primitive', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'field1', value: 'value1' }],
      },
      connections: [],
    };

    const input: TypedField[][] = [
      [{ value: 'not-an-object', kind: 'primitive' }],
    ];
    const executeFn = () => setNodePlugin.execute(node, input);
    expect(executeFn).toThrow(NodeExecutionError);
    expect(executeFn).toThrow('Set node requires input value to be an object');
  });

  it('should throw NodeExecutionError when inputField.value is an array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'field1', value: 'value1' }],
      },
      connections: [],
    };

    const input: TypedField[][] = [[{ value: [1, 2, 3], kind: 'primitive' }]];
    const executeFn = () => setNodePlugin.execute(node, input);
    expect(executeFn).toThrow(NodeExecutionError);
    expect(executeFn).toThrow('Set node requires input value to be an object');
  });

  it('should handle empty input array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'field1', value: 'value1' }],
      },
      connections: [],
    };

    const input: TypedField[][] = [];
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(result).toEqual([]);
  });

  it('should handle empty inner array', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'field1', value: 'value1' }],
      },
      connections: [],
    };

    const input: TypedField[][] = [[]];
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([]);
  });

  it('should set nested field using dot notation', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'user.name', value: 'John Doe' }],
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ existing: 'data' }]]);
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(extractTypedFieldResult(result)).toEqual([
      [{ existing: 'data', user: { name: 'John Doe' } }],
    ]);
  });

  it('should set deeply nested field and create intermediate objects', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'address.location.city', value: 'New York' }],
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ existing: 'data' }]]);
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(extractTypedFieldResult(result)).toEqual([
      [
        {
          existing: 'data',
          address: { location: { city: 'New York' } },
        },
      ],
    ]);
  });

  it('should overwrite existing nested field', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Set',
      type: 'builtIn.set',
      position: { x: 0, y: 0 },
      parameters: {
        values: [{ path: 'user.name', value: 'Updated Name' }],
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ user: { name: 'Old Name', age: 30 } }],
    ]);
    const result = setNodePlugin.execute(node, input) as TypedField[][];

    expect(extractTypedFieldResult(result)).toEqual([
      [{ user: { name: 'Updated Name', age: 30 } }],
    ]);
  });
});
