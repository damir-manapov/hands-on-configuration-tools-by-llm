import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';

const FilterNodeConditionSchema = z.object({
  leftValue: z
    .string()
    .describe(
      'The field name from the input data to evaluate. Supports nested fields using dot notation (e.g., "user.name" or "address.city"). The value of this field will be compared against rightValue.',
    ),
  rightValue: z
    .string()
    .describe(
      'The value to compare against. This is a static string value that will be compared with the field specified in leftValue.',
    ),
  operator: z
    .enum(['equals', 'notEquals', 'contains'])
    .describe(
      'The comparison operator: "equals" for exact match, "notEquals" for non-match, "contains" to check if leftValue contains rightValue as a substring.',
    ),
});

const FilterNodeParametersSchema = z.object({
  condition: FilterNodeConditionSchema.describe(
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

function getNestedFieldValue(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function evaluateCondition(
  item: Record<string, unknown>,
  condition: {
    leftValue: string;
    rightValue: string;
    operator: string;
  },
): boolean {
  const leftValueRaw = getNestedFieldValue(item, condition.leftValue);
  let leftValue = '';
  if (
    leftValueRaw !== null &&
    leftValueRaw !== undefined &&
    (typeof leftValueRaw === 'string' ||
      typeof leftValueRaw === 'number' ||
      typeof leftValueRaw === 'boolean')
  ) {
    leftValue = String(leftValueRaw);
  }
  const rightValue = condition.rightValue;

  switch (condition.operator) {
    case 'equals':
      return leftValue === rightValue;
    case 'notEquals':
      return leftValue !== rightValue;
    case 'contains':
      return leftValue.includes(rightValue);
    default:
      return false;
  }
}

function executeFilterNode(
  node: WorkflowNode,
  input: unknown[][],
): unknown[][] {
  const condition = (node.parameters['condition'] as {
    leftValue: string;
    rightValue: string;
    operator: string;
  }) ?? { leftValue: '', rightValue: '', operator: 'equals' };
  const mode = (node.parameters['mode'] as 'pass' | 'drop') ?? 'pass';

  const result: unknown[][] = [];

  for (const inputItem of input) {
    const item = inputItem[0] as Record<string, unknown>;
    const matches = evaluateCondition(item, condition);

    const shouldInclude = mode === 'pass' ? matches : !matches;

    if (shouldInclude) {
      result.push(inputItem);
    }
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
