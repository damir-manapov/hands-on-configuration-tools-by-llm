import { z } from 'zod';
import type { WorkflowNode, TypedField } from '../../types.js';
import type { NodePlugin, ParametersExample } from '../../plugin.js';
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
    'The condition to evaluate. Items matching the condition will be routed to the "true" output port, others to the "false" output port.',
  ),
});

function validateIfNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, IfNodeParametersSchema);
}

async function executeIfNode(
  node: WorkflowNode,
  input: TypedField[][],
): Promise<Record<string, TypedField[][]>> {
  const condition = node.parameters['condition'] as Condition;

  const trueBatches: TypedField[][] = [];
  const falseBatches: TypedField[][] = [];

  for (const inputItem of input) {
    const trueItems: TypedField[] = [];
    const falseItems: TypedField[] = [];

    for (const inputField of inputItem) {
      if (!inputField) {
        throw new NodeExecutionError(
          node.id,
          'If node received undefined or null input field',
        );
      }

      const matches = await evaluateCondition(inputField, condition);

      if (matches) {
        trueItems.push(inputField);
      } else {
        falseItems.push(inputField);
      }
    }

    // Only add batches that have items
    if (trueItems.length > 0) {
      trueBatches.push(trueItems);
    }
    if (falseItems.length > 0) {
      falseBatches.push(falseItems);
    }
  }

  return {
    true: trueBatches,
    false: falseBatches,
  };
}

const parametersExamples: ParametersExample[] = [
  {
    title: 'Route Active vs Inactive',
    description:
      'Route items where status equals "active" to the "true" port, others to "false" port.',
    parameters: {
      condition: {
        path: 'status',
        value: 'active',
        operator: 'equals',
      },
    },
  },
  {
    title: 'Route by Email Domain',
    description:
      'Route items where user.email contains "@example.com" to "true" port, others to "false" port. Uses nested field path.',
    parameters: {
      condition: {
        path: 'user.email',
        value: '@example.com',
        operator: 'contains',
      },
    },
  },
  {
    title: 'Route High Priority Items',
    description:
      'Route items where priority does not equal "low" to "true" port, low priority items to "false" port.',
    parameters: {
      condition: {
        path: 'priority',
        value: 'low',
        operator: 'notEquals',
      },
    },
  },
];

export const ifNodePlugin: NodePlugin = {
  nodeType: 'builtIn.if',
  name: 'If',
  purpose:
    'Conditional routing node that routes data items to different output ports based on a condition. Items matching the condition go to the "true" port, others to the "false" port.',
  useCases: [
    'Conditional workflow branching',
    'Routing data based on conditions',
    'Implementing business logic with conditional flows',
    'Data splitting and categorization',
  ],
  outputPorts: ['true', 'false'],
  dynamicOutputsAllowed: false,
  getParameterSchema: () => serializeParameterSchema(IfNodeParametersSchema),
  validate: validateIfNodeParameters,
  execute: executeIfNode,
  parametersExamples,
};
