import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';

const SetNodeValueSchema = z.object({
  name: z.string(),
  value: z.string(),
});

const SetNodeParametersSchema = z.object({
  values: z.array(SetNodeValueSchema),
});

function validateSetNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, SetNodeParametersSchema);
}

function executeSetNode(node: WorkflowNode, input: unknown[][]): unknown[][] {
  const values =
    (node.parameters['values'] as { name: string; value: string }[]) ?? [];
  const result: unknown[][] = [];

  for (const inputItem of input) {
    const outputItem: Record<string, unknown> = {
      ...(inputItem[0] as Record<string, unknown>),
    };
    for (const value of values) {
      outputItem[value.name] = value.value;
    }
    result.push([outputItem]);
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
  getParameterSchema: () =>
    serializeParameterSchema(SetNodeParametersSchema),
  validate: validateSetNodeParameters,
  execute: executeSetNode,
};
