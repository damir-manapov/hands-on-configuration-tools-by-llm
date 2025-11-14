import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import { validateNodeParameters } from '../validate.js';

const IfNodeConditionsSchema = z.object({
  leftValue: z.string(),
  rightValue: z.string(),
  operator: z.enum(['equals', 'notEquals', 'contains']),
});

const IfNodeParametersSchema = z.object({
  conditions: IfNodeConditionsSchema,
});

function validateIfNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, IfNodeParametersSchema);
}

function executeIfNode(
  node: WorkflowNode,
  input: unknown[][],
): unknown[][] {
  const conditions = (node.parameters['conditions'] as {
    leftValue: string;
    rightValue: string;
    operator: string;
  }) ?? { leftValue: '', rightValue: '', operator: 'equals' };

  const result: unknown[][] = [];

  for (const inputItem of input) {
    const item = inputItem[0] as Record<string, unknown>;
    const leftValueRaw = item[conditions.leftValue];
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
    const rightValue = conditions.rightValue;
    let matches = false;

    switch (conditions.operator) {
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
  purpose: 'Conditional routing based on a single condition. Evaluates a condition and adds a _matched field to indicate whether the condition was met.',
  useCases: [
    'Conditional workflow branching',
    'Filtering data based on conditions',
    'Implementing business logic with conditions',
    'Data validation and routing',
  ],
  getParameterSchema: () => IfNodeParametersSchema,
  validate: validateIfNodeParameters,
  execute: executeIfNode,
};
