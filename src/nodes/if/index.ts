import { z } from 'zod';
import type { WorkflowNode, TypedField } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import { NodeExecutionError } from '../../errors/index.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';
import {
  ConditionSchema,
  type Condition,
  evaluateCondition,
} from '../utils/evaluate-condition.js';

const IfNodeParametersSchema = z.object({
  condition: ConditionSchema.describe(
    'The condition to evaluate. If the condition matches, the item will have a _matched field set to true, otherwise false.',
  ),
});

function validateIfNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, IfNodeParametersSchema);
}

async function executeIfNode(
  node: WorkflowNode,
  input: TypedField[][],
): Promise<TypedField[][]> {
  const condition = node.parameters['condition'] as Condition;

  if (!condition || typeof condition !== 'object') {
    throw new NodeExecutionError(
      node.id,
      'If node requires a condition parameter, but it is missing or invalid',
    );
  }

  const result: TypedField[][] = [];

  for (const inputItem of input) {
    const outputItem: TypedField[] = [];

    for (const inputField of inputItem) {
      if (!inputField) {
        throw new NodeExecutionError(
          node.id,
          'If node received undefined or null input field',
        );
      }

      const matches = await evaluateCondition(inputField, condition);

      const outputObj: Record<string, TypedField> = {
        ...(inputField.value as Record<string, TypedField>),
      };
      outputObj['_matched'] = {
        value: matches,
        kind: 'primitive',
      };
      outputItem.push({
        value: outputObj,
        kind: 'primitive',
      });
    }

    result.push(outputItem);
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
