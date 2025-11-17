import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin, ParametersExample } from '../../plugin.js';
import type { TypedField } from '../../types.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';
import { NodeExecutionError } from '../../errors/index.js';
import { setNestedField } from '../utils/set-nested-field.js';

const SetNodeValueSchema = z.object({
  path: z
    .string()
    .describe(
      'The path to the field to set or overwrite. Supports nested paths using dot notation (e.g., "status" or "user.name" or "address.city").',
    ),
  value: z
    .string()
    .describe(
      'The static value to assign to the field. This will be set as a string.',
    ),
});

const SetNodeParametersSchema = z.object({
  values: z
    .array(SetNodeValueSchema)
    .describe(
      'Array of field-value pairs to set. Each item will add or overwrite a field in the data items passing through this node.',
    ),
});

function validateSetNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, SetNodeParametersSchema);
}

function executeSetNode(
  node: WorkflowNode,
  input: TypedField[][],
): TypedField[][] {
  const values =
    (node.parameters['values'] as { path: string; value: string }[]) ?? [];
  const result: TypedField[][] = [];

  for (const inputItem of input) {
    const outputItem: TypedField[] = [];

    for (const inputField of inputItem) {
      // Extract the value from TypedField, which should be Record<string, TypedField>
      if (!inputField) {
        throw new NodeExecutionError(
          node.id,
          'Set node requires a TypedField input, but received undefined or null',
        );
      }
      if (inputField.value === null || inputField.value === undefined) {
        throw new NodeExecutionError(
          node.id,
          'Set node requires input value to be an object (Record<string, TypedField>), but received null or undefined',
        );
      }
      if (
        typeof inputField.value !== 'object' ||
        Array.isArray(inputField.value)
      ) {
        throw new NodeExecutionError(
          node.id,
          `Set node requires input value to be an object (Record<string, TypedField>), but received ${Array.isArray(inputField.value) ? 'an array' : typeof inputField.value}`,
        );
      }
      const inputObj = inputField.value as Record<string, TypedField>;

      // Deep clone the input object to avoid mutating the original
      const outputObj = JSON.parse(JSON.stringify(inputObj)) as Record<
        string,
        TypedField
      >;

      for (const valueConfig of values) {
        const typedFieldValue: TypedField = {
          value: valueConfig.value,
          kind: 'primitive',
        };
        setNestedField(outputObj, valueConfig.path, typedFieldValue);
      }
      outputItem.push({
        value: outputObj,
        kind: 'primitive',
      });
    }

    result.push(outputItem);
  }

  return result;
}

const parametersExamples: ParametersExample[] = [
  {
    title: 'Set Single Field',
    description:
      'Set a single field "status" to the value "active" in all data items.',
    parameters: {
      values: [
        {
          path: 'status',
          value: 'active',
        },
      ],
    },
  },
  {
    title: 'Set Multiple Fields',
    description:
      'Set multiple fields at once: "status" to "active" and "priority" to "high".',
    parameters: {
      values: [
        {
          path: 'status',
          value: 'active',
        },
        {
          path: 'priority',
          value: 'high',
        },
      ],
    },
  },
  {
    title: 'Set Nested Field',
    description:
      'Set a nested field using dot notation. The path "user.name" will create or update the name field within the user object.',
    parameters: {
      values: [
        {
          path: 'user.name',
          value: 'John Doe',
        },
      ],
    },
  },
  {
    title: 'Set Deep Nested Field',
    description:
      'Set a deeply nested field. The path "address.location.city" will create intermediate objects if they don\'t exist.',
    parameters: {
      values: [
        {
          path: 'address.location.city',
          value: 'New York',
        },
      ],
    },
  },
];

export const setNodePlugin: NodePlugin = {
  nodeType: 'builtIn.set',
  name: 'Set',
  purpose: 'Add or overwrite fields in data items with static values.',
  useCases: [
    'Adding new fields to data items',
    'Overwriting existing field values',
    'Setting default values',
    'Transforming data structure by adding fields',
  ],
  getParameterSchema: () => serializeParameterSchema(SetNodeParametersSchema),
  validate: validateSetNodeParameters,
  execute: executeSetNode,
  parametersExamples,
};
