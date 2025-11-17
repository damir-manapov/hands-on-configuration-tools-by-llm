import { describe, it, expect } from 'vitest';
import { codeNodePlugin } from './index.js';
import type { WorkflowNode, TypedField } from '../../types.js';
import { toTypedFieldInput } from '../utils/to-typed-field-input.js';
import { extractTypedFieldResult } from '../utils/extract-typed-field-result.js';
import { NodeExecutionError } from '../../errors/index.js';
import {
  CodeExecutionTimeoutError,
  CodeExecutionError,
  CodeInvalidReturnFormatError,
  CodeResolverNotAvailableError,
} from './errors.js';

describe('Code Node - Execution', () => {
  it('should execute code and return transformed data', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          const plain = extractValue(item);
          return toTypedField({ ...plain, processed: true });
        `,
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ name: 'test', value: 123 }]]);
    const result = await codeNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ name: 'test', value: 123, processed: true }],
    ]);
  });

  it('should handle multiple input items', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          const plain = extractValue(item);
          return toTypedField({ ...plain, doubled: plain.value * 2 });
        `,
      },
      connections: [],
    };

    const input = toTypedFieldInput([
      [{ value: 5 }],
      [{ value: 10 }],
      [{ value: 15 }],
    ]);
    const result = await codeNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ value: 5, doubled: 10 }],
      [{ value: 10, doubled: 20 }],
      [{ value: 15, doubled: 30 }],
    ]);
  });

  it('should have access to Math and JSON utilities', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          const plain = extractValue(item);
          return toTypedField({
            ...plain,
            sqrt: Math.sqrt(plain.value),
            json: JSON.stringify(plain)
          });
        `,
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ value: 16 }]]);
    const result = await codeNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ value: 16, sqrt: 4, json: '{"value":16}' }],
    ]);
  });

  it('should throw CodeInvalidReturnFormatError when code returns invalid format', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return "not an array";',
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ test: 'data' }]]);
    const promise = codeNodePlugin.execute(node, input);

    await expect(promise).rejects.toThrow(CodeInvalidReturnFormatError);
    await expect(promise).rejects.toThrow(
      'Code must return a TypedField object',
    );
  });

  it('should throw CodeExecutionTimeoutError when timeout is exceeded', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          while(true) {
            // Infinite loop
          }
        `,
        timeout: 100,
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ test: 'data' }]]);
    const promise = codeNodePlugin.execute(node, input);

    await expect(promise).rejects.toThrow(CodeExecutionTimeoutError);
    await expect(promise).rejects.toThrow('exceeded timeout of 100ms');
  }, 10000);

  it('should throw CodeExecutionError when code has syntax or runtime errors', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'require("fs");',
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ test: 'data' }]]);
    const promise = codeNodePlugin.execute(node, input);

    await expect(promise).rejects.toThrow(CodeExecutionError);
    await expect(promise).rejects.toThrow(
      'Code execution error in node node-1',
    );
  });

  it('should throw CodeExecutionError for syntax errors', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return { invalid syntax }',
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ test: 'data' }]]);

    await expect(codeNodePlugin.execute(node, input)).rejects.toThrow(
      CodeExecutionError,
    );
  });

  it('should have all code errors extend NodeExecutionError', () => {
    const nodeId = 'test-node';
    const timeoutError = new CodeExecutionTimeoutError(nodeId, 1000);
    const executionError = new CodeExecutionError(nodeId, 'test error');
    const formatError = new CodeInvalidReturnFormatError(nodeId);

    expect(timeoutError).toBeInstanceOf(NodeExecutionError);
    expect(executionError).toBeInstanceOf(NodeExecutionError);
    expect(formatError).toBeInstanceOf(NodeExecutionError);

    expect(timeoutError.nodeId).toBe(nodeId);
    expect(executionError.nodeId).toBe(nodeId);
    expect(formatError.nodeId).toBe(nodeId);

    expect(timeoutError.timeout).toBe(1000);
  });

  it('should work with extractValue utility function', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          const plain = extractValue(item);
          return toTypedField({ extracted: plain.name });
        `,
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ name: 'John', age: 30 }]]);
    const result = await codeNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ extracted: 'John' }],
    ]);
  });

  it('should work with toTypedField utility function', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          const plain = extractValue(item);
          return toTypedField({ ...plain, newField: 'added' });
        `,
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ name: 'test' }]]);
    const result = await codeNodePlugin.execute(node, input);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ name: 'test', newField: 'added' }],
    ]);
  });

  it('should work with resolve utility function when resolver is provided', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          return resolve(item).then(resolved => {
            const resolvedValue = extractValue({ value: resolved, kind: 'primitive' });
            return toTypedField({ resolved: resolvedValue.name });
          });
        `,
      },
      connections: [],
    };

    const input: TypedField[][] = [
      [
        {
          value: 'user-123',
          kind: 'link',
          entity: 'user',
        },
      ],
    ];

    const resolver = (value: unknown, entityName: string) => {
      if (entityName === 'user' && value === 'user-123') {
        return {
          id: { value: 'user-123', kind: 'primitive' as const },
          name: { value: 'John', kind: 'primitive' as const },
        };
      }
      throw new Error(
        `Unexpected resolver call: ${entityName}, ${String(value)}`,
      );
    };

    const result = await codeNodePlugin.execute(node, input, resolver);

    expect(extractTypedFieldResult(result['main']!)).toEqual([
      [{ resolved: 'John' }],
    ]);
  });

  it('should throw error when resolve is called without resolver', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          return resolve(item).then(resolved => {
            return item;
          });
        `,
      },
      connections: [],
    };

    const input: TypedField[][] = [
      [
        {
          value: 'user-123',
          kind: 'link',
          entity: 'user',
        },
      ],
    ];

    const promise = codeNodePlugin.execute(node, input);
    await expect(promise).rejects.toThrow(CodeResolverNotAvailableError);
    await expect(promise).rejects.toThrow('Resolver is not available');
  });

  it('should validate that returned values are TypedField objects', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      title: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return { not: "a TypedField" };',
      },
      connections: [],
    };

    const input = toTypedFieldInput([[{ test: 'data' }]]);
    const promise = codeNodePlugin.execute(node, input);

    await expect(promise).rejects.toThrow(CodeInvalidReturnFormatError);
    await expect(promise).rejects.toThrow(
      'Code must return a TypedField object',
    );
  });
});
