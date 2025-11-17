import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/engine.js';
import type { Workflow, FieldResolver } from '../src/types.js';
import { convertValueToTypedField } from '../src/nodes/utils/convert-value-to-typed-field.js';
import { extractTypedFieldValue } from '../src/nodes/utils/extract-typed-field-value.js';

describe('WorkflowEngine - Execution', () => {
  it('should execute simple workflow', async () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Start',
          type: 'builtIn.start',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
    };

    engine.addWorkflow(workflow);
    const result = await engine.executeWorkflow('test-1');

    expect(result.finished).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should throw error when executing non-existent workflow', async () => {
    const engine = new WorkflowEngine();

    await expect(engine.executeWorkflow('non-existent')).rejects.toThrow(
      'not found',
    );
  });

  it('should throw error when executing inactive workflow', async () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: false,
      nodes: [
        {
          id: 'node-1',
          name: 'Start',
          type: 'builtIn.start',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
      ],
    };

    engine.addWorkflow(workflow);

    await expect(engine.executeWorkflow('test-1')).rejects.toThrow(
      'not active',
    );
  });

  it('should throw error when node connects to non-existent node', () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Start',
          type: 'builtIn.start',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {
            main: [{ node: 'node-2', type: 'main', index: 0 }],
          },
        },
      ],
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('connects to non-existent node');
  });

  it('should pass resolver to code node through workflow execution', async () => {
    const engine = new WorkflowEngine();
    let resolverCalled = false;
    let resolvedValue: unknown = null;

    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Start',
          type: 'builtIn.start',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: {},
        },
        {
          id: 'node-2',
          name: 'Code',
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
          connections: {},
        },
      ],
    };

    engine.addWorkflow(workflow);

    // Create a resolver that we can verify was called
    const resolver: FieldResolver = (value, entityName) => {
      resolverCalled = true;
      resolvedValue = value;
      if (entityName === 'user' && value === 'user-123') {
        return Promise.resolve({
          id: convertValueToTypedField(value),
          name: convertValueToTypedField('John'),
        });
      }
      return Promise.reject(
        new Error(`Unexpected resolver call: ${entityName}, ${String(value)}`),
      );
    };

    // Provide input data directly to the code node (node-2)
    // This bypasses the start node which always returns empty data
    const inputData = {
      'node-2': [
        [
          {
            value: 'user-123',
            kind: 'link' as const,
            entity: 'user',
          },
        ],
      ],
    };

    const result = await engine.executeWorkflow('test-1', inputData, resolver);

    if (!result.finished && result.error) {
      throw result.error;
    }
    expect(result.finished).toBe(true);
    expect(resolverCalled).toBe(true);
    expect(resolvedValue).toBe('user-123');
    const field = result.data['node-2']?.[0]?.[0];
    expect(field).toBeDefined();
    expect(extractTypedFieldValue(field!)).toEqual({ resolved: 'John' });
  });

  it('should use inputData for nodes with no connections', async () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Set',
          type: 'builtIn.set',
          position: { x: 0, y: 0 },
          parameters: {
            values: [
              {
                path: 'test',
                value: 'value',
              },
            ],
          },
          connections: {},
        },
      ],
    };

    engine.addWorkflow(workflow);

    // Provide input data directly to the node
    const inputData = {
      'node-1': [
        [
          {
            value: {
              existing: { value: 'existing-value', kind: 'primitive' as const },
            },
            kind: 'primitive' as const,
          },
        ],
      ],
    };

    const result = await engine.executeWorkflow('test-1', inputData);

    expect(result.finished).toBe(true);
    const field = result.data['node-1']?.[0]?.[0];
    expect(field).toBeDefined();
    const extracted = extractTypedFieldValue(field!);
    expect(extracted).toEqual({
      existing: 'existing-value',
      test: 'value',
    });
  });

  it('should return empty array when node has no connections and no inputData', async () => {
    const engine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-1',
      name: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          name: 'Set',
          type: 'builtIn.set',
          position: { x: 0, y: 0 },
          parameters: {
            values: [
              {
                path: 'test',
                value: 'value',
              },
            ],
          },
          connections: {},
        },
      ],
    };

    engine.addWorkflow(workflow);

    // No inputData provided - node will get [[]] (empty batch)
    const result = await engine.executeWorkflow('test-1');

    expect(result.finished).toBe(true);
    // Set node with empty input batch produces empty output batch
    expect(result.data['node-1']).toEqual([[]]);
  });
});
