import { describe, it, expect } from 'vitest';
import { codeNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';
import { NodeExecutionError } from '../../errors.js';
import {
  CodeExecutionTimeoutError,
  CodeExecutionError,
  CodeInvalidReturnFormatError,
} from './errors.js';

describe('Code Node - Execution', () => {
  it('should execute code and return transformed data', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return input.map(item => [Object.assign({}, item[0], { processed: true })]);',
      },
      connections: {},
    };

    const input = [[{ name: 'test', value: 123 }]];
    const result = await codeNodePlugin.execute(node, input);

    expect(result).toHaveLength(1);
    expect(result[0]?.[0]).toEqual({
      name: 'test',
      value: 123,
      processed: true,
    });
  });

  it('should pass through input when code is empty', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: '',
      },
      connections: {},
    };

    const input = [[{ test: 'data' }]];
    const result = await codeNodePlugin.execute(node, input);

    expect(result).toEqual(input);
  });

  it('should handle multiple input items', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return input.map(item => [Object.assign({}, item[0], { doubled: item[0].value * 2 })]);',
      },
      connections: {},
    };

    const input = [[{ value: 5 }], [{ value: 10 }], [{ value: 15 }]];
    const result = await codeNodePlugin.execute(node, input);

    expect(result).toHaveLength(3);
    expect(result[0]?.[0]).toEqual({ value: 5, doubled: 10 });
    expect(result[1]?.[0]).toEqual({ value: 10, doubled: 20 });
    expect(result[2]?.[0]).toEqual({ value: 15, doubled: 30 });
  });

  it('should have access to Math and JSON utilities', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: `
          return input.map(item => [{
            ...item[0],
            sqrt: Math.sqrt(item[0].value),
            json: JSON.stringify(item[0])
          }]);
        `,
      },
      connections: {},
    };

    const input = [[{ value: 16 }]];
    const result = await codeNodePlugin.execute(node, input);

    expect(result[0]?.[0]).toHaveProperty('sqrt', 4);
    expect(result[0]?.[0]).toHaveProperty('json', '{"value":16}');
  });

  it('should throw CodeInvalidReturnFormatError when code returns invalid format', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return "not an array";',
      },
      connections: {},
    };

    const input = [[{ test: 'data' }]];

    await expect(codeNodePlugin.execute(node, input)).rejects.toThrow(
      CodeInvalidReturnFormatError,
    );
    await expect(codeNodePlugin.execute(node, input)).rejects.toThrow(
      'Code in node node-1 must return an array of arrays',
    );
  });

  it('should throw CodeExecutionTimeoutError when timeout is exceeded', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code',
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
      connections: {},
    };

    const input = [[{ test: 'data' }]];

    await expect(codeNodePlugin.execute(node, input)).rejects.toThrow(
      CodeExecutionTimeoutError,
    );
    await expect(codeNodePlugin.execute(node, input)).rejects.toThrow(
      'exceeded timeout of 100ms',
    );
  }, 10000);

  it('should throw CodeExecutionError when code has syntax or runtime errors', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'require("fs");',
      },
      connections: {},
    };

    const input = [[{ test: 'data' }]];

    await expect(codeNodePlugin.execute(node, input)).rejects.toThrow(
      CodeExecutionError,
    );
    await expect(codeNodePlugin.execute(node, input)).rejects.toThrow(
      'Code execution error in node node-1',
    );
  });

  it('should throw CodeExecutionError for syntax errors', async () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return { invalid syntax }',
      },
      connections: {},
    };

    const input = [[{ test: 'data' }]];

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
});
