import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import type { TypedField } from '../../types.js';
import { NodeExecutionError } from '../../errors/index.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';
import {
  ConditionSchema,
  type Condition,
  evaluateCondition,
} from '../utils/evaluate-condition.js';

const FilterNodeParametersSchema = z.object({
  condition: ConditionSchema.describe(
    'The condition to evaluate. Items will be filtered based on whether they match this condition.',
  ),
  mode: z
    .enum(['pass', 'drop'])
    .default('pass')
    .describe(
      'Filter mode: "pass" to keep items that match the condition, "drop" to remove items that match the condition.',
    ),
});

function validateFilterNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, FilterNodeParametersSchema);
}

async function executeFilterNode(
  node: WorkflowNode,
  input: TypedField[][],
): Promise<TypedField[][]> {
  const condition = node.parameters['condition'] as Condition;

  if (!condition || typeof condition !== 'object') {
    throw new NodeExecutionError(
      node.id,
      'Filter node requires a condition parameter, but it is missing or invalid',
    );
  }

  const mode = (node.parameters['mode'] as 'pass' | 'drop') ?? 'pass';

  const result: TypedField[][] = [];

  for (const inputItem of input) {
    const filteredItem: TypedField[] = [];

    for (const inputField of inputItem) {
      if (!inputField) {
        throw new NodeExecutionError(
          node.id,
          'Filter node received undefined or null input field',
        );
      }

      const matches = await evaluateCondition(inputField, condition);

      const shouldInclude = mode === 'pass' ? matches : !matches;

      if (shouldInclude) {
        filteredItem.push(inputField);
      }
    }

    result.push(filteredItem);
  }

  return result;
}

export const filterNodePlugin: NodePlugin = {
  nodeType: 'builtIn.filter',
  name: 'Filter',
  purpose:
    'Filter items based on conditions, outputting only items that match (pass mode) or do not match (drop mode) the condition.',
  useCases: [
    'Removing unwanted data items',
    'Selecting specific records based on criteria',
    'Data cleaning and preprocessing',
    'Filtering data before further processing',
  ],
  getParameterSchema: () =>
    serializeParameterSchema(FilterNodeParametersSchema),
  validate: validateFilterNodeParameters,
  execute: executeFilterNode,
};
