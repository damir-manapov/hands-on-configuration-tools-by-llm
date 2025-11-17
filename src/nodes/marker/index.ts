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

const MarkerNodeParametersSchema = z.object({
  condition: ConditionSchema.describe(
    'The condition to evaluate. If the condition matches, the item will have the specified field set to true, otherwise false.',
  ),
  field: z
    .string()
    .min(1, 'Field name cannot be empty')
    .optional()
    .default('_matched')
    .describe(
      'The name of the field to add to each item indicating whether the condition matched. Defaults to "_matched".',
    ),
});

function validateMarkerNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, MarkerNodeParametersSchema);
}

async function executeMarkerNode(
  node: WorkflowNode,
  input: TypedField[][],
): Promise<Record<string, TypedField[][]>> {
  const condition = node.parameters['condition'] as Condition;
  const fieldName = (node.parameters['field'] as string) ?? '_matched';

  const result: TypedField[][] = [];

  for (const inputItem of input) {
    const outputItem: TypedField[] = [];

    for (const inputField of inputItem) {
      if (!inputField) {
        throw new NodeExecutionError(
          node.id,
          'Marker node received undefined or null input field',
        );
      }

      const matches = await evaluateCondition(inputField, condition);

      const outputObj: Record<string, TypedField> = {
        ...(inputField.value as Record<string, TypedField>),
      };
      outputObj[fieldName] = {
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

  return {
    main: result,
  };
}

const parametersExamples: ParametersExample[] = [
  {
    title: 'Check Status Equals Active',
    description:
      'Evaluate if the status field equals "active". Adds a _matched field set to true if the condition matches, false otherwise.',
    parameters: {
      condition: {
        path: 'status',
        value: 'active',
        operator: 'equals',
      },
    },
  },
  {
    title: 'Check Email Contains Domain',
    description:
      'Check if the user.email field contains "@example.com". Uses nested field path to access email within user object.',
    parameters: {
      condition: {
        path: 'user.email',
        value: '@example.com',
        operator: 'contains',
      },
    },
  },
  {
    title: 'Check Priority Not Low',
    description:
      'Evaluate if the priority field does not equal "low". Useful for filtering out low priority items.',
    parameters: {
      condition: {
        path: 'priority',
        value: 'low',
        operator: 'notEquals',
      },
    },
  },
  {
    title: 'Mark with Custom Field Name',
    description:
      'Mark items with a custom field name "isValid" instead of the default "_matched" field.',
    parameters: {
      condition: {
        path: 'status',
        value: 'active',
        operator: 'equals',
      },
      field: 'isValid',
    },
  },
];

export const markerNodePlugin: NodePlugin = {
  nodeType: 'builtIn.marker',
  name: 'Marker',
  purpose:
    'Marks data items with a field (default: "_matched") based on a condition evaluation. Does not route data - all items pass through with the specified field indicating whether the condition was met.',
  useCases: [
    'Marking data items with condition results',
    'Adding metadata for downstream filtering',
    'Condition evaluation without routing',
    'Data validation and marking',
  ],
  outputPorts: ['main'],
  getParameterSchema: () =>
    serializeParameterSchema(MarkerNodeParametersSchema),
  validate: validateMarkerNodeParameters,
  execute: executeMarkerNode,
  parametersExamples,
};
