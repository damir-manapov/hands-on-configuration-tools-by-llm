import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import type { TypedField } from '../../types.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';
import { NodeExecutionError } from '../../errors/index.js';

const SetNodeValueSchema = z.object({
  name: z
    .string()
    .describe('The name of the field to set or overwrite in the data item.'),
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
    (node.parameters['values'] as { name: string; value: string }[]) ?? [];
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

      const outputObj: Record<string, TypedField> = { ...inputObj };
      for (const value of values) {
        outputObj[value.name] = {
          value: value.value,
          kind: 'primitive',
        };
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
};
