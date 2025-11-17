import { z } from 'zod';
import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/engine.js';
import type { NodePlugin, Workflow } from '../src/index.js';
import type { WorkflowNode, FieldResolver } from '../src/types.js';
import type { TypedField } from '../src/types.js';
import { serializeParameterSchema } from '../src/schema-serializer.js';
import { extractTypedFieldValue } from '../src/nodes/utils/extract-typed-field-value.js';
import { convertValueToTypedField } from '../src/nodes/utils/convert-value-to-typed-field.js';

describe('WorkflowEngine - Plugin System', () => {
  it('should register a custom node plugin', () => {
    const engine = new WorkflowEngine();

    const customPlugin: NodePlugin = {
      nodeType: 'custom-node',
      name: 'Custom Node',
      purpose: 'A custom node for testing plugin registration.',
      useCases: ['Testing plugin system', 'Custom functionality'],
      outputPorts: ['main'],
      dynamicOutputsAllowed: false,
      getParameterSchema: () => serializeParameterSchema(z.object({})),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      validate: () => {},
      execute: (): Record<string, TypedField[][]> => ({ main: [[]] }),
      parametersExamples: [
        {
          title: 'Basic Custom Node',
          description: 'A simple custom node with no parameters.',
          parameters: {},
        },
      ],
    };

    engine.registerNode(customPlugin);

    expect(engine.getRegisteredNodeTypes()).toContain('custom-node');
  });

  it('should throw error when registering duplicate node type', () => {
    const engine = new WorkflowEngine();

    const plugin: NodePlugin = {
      nodeType: 'builtIn.noop',
      name: 'Test Noop',
      purpose: 'Test plugin',
      useCases: ['Testing'],
      outputPorts: ['main'],
      dynamicOutputsAllowed: false,
      getParameterSchema: () => serializeParameterSchema(z.object({})),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      validate: () => {},
      execute: (): Record<string, TypedField[][]> => ({ main: [[]] }),
      parametersExamples: [
        {
          title: 'Test Noop Node',
          description: 'A test noop node example.',
          parameters: {},
        },
      ],
    };

    expect(() => {
      engine.registerNode(plugin);
    }).toThrow('already registered');
  });

  it('should prevent unregistering built-in nodes', () => {
    const engine = new WorkflowEngine();

    expect(() => {
      engine.unregisterNode('builtIn.noop');
    }).toThrow('Cannot unregister built-in node type');
  });

  it('should allow unregistering custom nodes', () => {
    const engine = new WorkflowEngine();

    const customPlugin: NodePlugin = {
      nodeType: 'custom-node',
      name: 'Custom Node',
      purpose: 'Test custom node',
      useCases: ['Testing'],
      outputPorts: ['main'],
      dynamicOutputsAllowed: false,
      getParameterSchema: () => serializeParameterSchema(z.object({})),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      validate: () => {},
      execute: (): Record<string, TypedField[][]> => ({ main: [[]] }),
      parametersExamples: [
        {
          title: 'Test Custom Node',
          description: 'A test custom node example.',
          parameters: {},
        },
      ],
    };

    engine.registerNode(customPlugin);
    expect(engine.getRegisteredNodeTypes()).toContain('custom-node');

    engine.unregisterNode('custom-node');
    expect(engine.getRegisteredNodeTypes()).not.toContain('custom-node');
  });

  it('should execute workflow with custom node plugin', async () => {
    const engine = new WorkflowEngine();

    const customPlugin: NodePlugin = {
      nodeType: 'custom-echo',
      name: 'Echo',
      purpose: 'Echoes text back in the output data.',
      useCases: ['Adding echo text to data', 'Testing custom nodes'],
      outputPorts: ['main'],
      dynamicOutputsAllowed: false,
      getParameterSchema: () =>
        serializeParameterSchema(
          z.object({
            text: z.string(),
          }),
        ),
      validate: (node: WorkflowNode) => {
        if (!node.parameters['text']) {
          throw new Error('Missing text parameter');
        }
      },
      execute: (node: WorkflowNode, input: TypedField[][]) => {
        const text = node.parameters['text'] as string;
        return {
          main: input.map((item) => {
            const inputField = item[0];
            const inputObj =
              inputField &&
              typeof inputField.value === 'object' &&
              !Array.isArray(inputField.value)
                ? (inputField.value as Record<string, TypedField>)
                : {};
            const outputObj: Record<string, TypedField> = { ...inputObj };
            outputObj['echo'] = convertValueToTypedField(text);
            return [{ value: outputObj, kind: 'primitive' as const }];
          }),
        };
      },
      parametersExamples: [
        {
          title: 'Echo Hello World',
          description: 'Echo the text "Hello World" in the output data.',
          parameters: {
            text: 'Hello World',
          },
        },
      ],
    };

    engine.registerNode(customPlugin);

    const workflow: Workflow = {
      id: 'test-1',
      title: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          title: 'Noop',
          type: 'builtIn.noop',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: [{ node: 'node-2', outputPort: 'main' }],
        },
        {
          id: 'node-2',
          title: 'Custom Echo',
          type: 'custom-echo',
          position: { x: 0, y: 0 },
          parameters: {
            text: 'Hello World',
          },
          connections: [],
        },
      ],
    };

    engine.addWorkflow(workflow);
    const result = await engine.executeWorkflow('test-1');

    expect(result.finished).toBe(true);
    const field = result.data['node-2']?.['main']?.[0]?.[0];
    expect(field).toBeDefined();
    expect(extractTypedFieldValue(field!)).toEqual({
      echo: 'Hello World',
    });
  });

  it('should validate custom node parameters', () => {
    const engine = new WorkflowEngine();

    const customPlugin: NodePlugin = {
      nodeType: 'custom-required',
      name: 'Required Field',
      purpose: 'Validates that a required field is present.',
      useCases: ['Parameter validation testing'],
      outputPorts: ['main'],
      dynamicOutputsAllowed: false,
      getParameterSchema: () =>
        serializeParameterSchema(
          z.object({
            requiredField: z.string(),
          }),
        ),
      validate: (node: WorkflowNode) => {
        if (!node.parameters['requiredField']) {
          throw new Error('requiredField is required');
        }
      },
      execute: (): Record<string, TypedField[][]> => ({ main: [[]] }),
      parametersExamples: [
        {
          title: 'Required Field Example',
          description: 'An example with the required field set.',
          parameters: {
            requiredField: 'test-value',
          },
        },
      ],
    };

    engine.registerNode(customPlugin);

    const workflow: Workflow = {
      id: 'test-1',
      title: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          title: 'Custom',
          type: 'custom-required',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: [],
        },
      ],
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('requiredField is required');
  });

  it('should throw error when using unregistered node type', () => {
    const engine = new WorkflowEngine();

    const workflow: Workflow = {
      id: 'test-1',
      title: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          title: 'Unknown',
          type: 'unknown-node-type',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: [],
        },
      ],
    };

    expect(() => {
      engine.addWorkflow(workflow);
    }).toThrow('invalid type');
  });

  it('should pass resolver to plugin execute function', async () => {
    const engine = new WorkflowEngine();
    let capturedResolver: FieldResolver | undefined;

    const customPlugin: NodePlugin = {
      nodeType: 'custom-resolver-test',
      name: 'Resolver Test',
      purpose: 'Tests that resolver is passed to plugins.',
      useCases: ['Testing resolver passing'],
      outputPorts: ['main'],
      dynamicOutputsAllowed: false,
      getParameterSchema: () => serializeParameterSchema(z.object({})),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      validate: () => {},
      execute: (
        _node: WorkflowNode,
        _input: TypedField[][],
        resolver?: FieldResolver,
      ): Record<string, TypedField[][]> => {
        capturedResolver = resolver;
        return { main: [[]] };
      },
      parametersExamples: [
        {
          title: 'Resolver Test Example',
          description: 'An example for testing resolver passing.',
          parameters: {},
        },
      ],
    };

    engine.registerNode(customPlugin);

    const workflow: Workflow = {
      id: 'test-1',
      title: 'Test Workflow',
      active: true,
      nodes: [
        {
          id: 'node-1',
          title: 'Noop',
          type: 'builtIn.noop',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: [{ node: 'node-2', outputPort: 'main' }],
        },
        {
          id: 'node-2',
          title: 'Resolver Test',
          type: 'custom-resolver-test',
          position: { x: 0, y: 0 },
          parameters: {},
          connections: [],
        },
      ],
    };

    engine.addWorkflow(workflow);

    const testResolver: FieldResolver = (value, entityName) => {
      return Promise.resolve({
        id: convertValueToTypedField(value),
        name: convertValueToTypedField(`resolved-${entityName}`),
      });
    };

    const result = await engine.executeWorkflow(
      'test-1',
      undefined,
      testResolver,
    );

    expect(result.finished).toBe(true);
    expect(capturedResolver).toBeDefined();
    expect(capturedResolver).toBe(testResolver);
  });
});
