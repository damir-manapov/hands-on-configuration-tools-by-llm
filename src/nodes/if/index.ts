import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';

const IfNodeConditionSchema = z.object({
  leftValue: z
    .string()
    .describe(
      'The field name from the input data to evaluate. The value of this field will be compared against rightValue.',
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

const IfNodeParametersSchema = z.object({
  condition: IfNodeConditionSchema.describe(
    'The condition to evaluate. If the condition matches, the item will have a _matched field set to true, otherwise false.',
  ),
});

function validateIfNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, IfNodeParametersSchema);
}

function executeIfNode(node: WorkflowNode, input: unknown[][]): unknown[][] {
  const condition = (node.parameters['condition'] as {
    leftValue: string;
    rightValue: string;
    operator: string;
  }) ?? { leftValue: '', rightValue: '', operator: 'equals' };

  const result: unknown[][] = [];

  for (const inputItem of input) {
    const item = inputItem[0] as Record<string, unknown>;
    const leftValueRaw = item[condition.leftValue];
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
    let matches = false;

    switch (condition.operator) {
      case 'equals':
        matches = leftValue === rightValue;
        break;
      case 'notEquals':
        matches = leftValue !== rightValue;
        break;
      case 'contains':
        matches = leftValue.includes(rightValue);
        break;
      default:
        matches = false;
    }

    result.push([{ ...item, _matched: matches }]);
  }

  return result;
}

export const ifNodePlugin: NodePlugin = {
  nodeType: 'builtIn.if',
  name: 'If',
  purpose:
    'Conditional routing based on a single condition. Evaluates a condition and adds a _matched field to indicate whether the condition was met.',
  useCases: [
    'Conditional workflow branching',
    'Filtering data based on conditions',
    'Implementing business logic with conditions',
    'Data validation and routing',
  ],
  getParameterSchema: () => serializeParameterSchema(IfNodeParametersSchema),
  validate: validateIfNodeParameters,
  execute: executeIfNode,
};
