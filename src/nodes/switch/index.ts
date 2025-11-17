import { z } from 'zod';
import type { WorkflowNode, TypedField } from '../../types.js';
import type { NodePlugin, ParametersExample } from '../../plugin.js';
import { NodeExecutionError, NodeValidationError } from '../../errors/index.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';
import {
  ConditionSchema,
  type Condition,
  evaluateCondition,
} from '../utils/evaluate-condition.js';

const SwitchRuleSchema = z.object({
  condition: ConditionSchema.describe(
    'The condition to evaluate. If this condition matches, the item will be routed to the specified output port.',
  ),
  output: z
    .string()
    .min(1, 'Output port name is required and cannot be empty')
    .describe('The name of the output port to route matching items to.'),
});

const SwitchNodeParametersSchema = z.object({
  rules: z
    .array(SwitchRuleSchema)
    .min(1, 'At least one rule is required')
    .describe(
      'Array of rules to evaluate in order. The first matching rule determines the output port. Items that match no rules go to the default output.',
    ),
  defaultOutput: z
    .string()
    .min(1, 'Default output port name is required and cannot be empty')
    .optional()
    .default('default')
    .describe(
      'The name of the output port for items that do not match any rule. Defaults to "default".',
    ),
});

function validateSwitchNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, SwitchNodeParametersSchema);

  // Additional validation: check for duplicate output port names in rules
  const rules = node.parameters['rules'] as {
    condition: Condition;
    output: string;
  }[];
  if (rules && Array.isArray(rules)) {
    const outputNames = new Set<string>();
    for (const [index, rule] of rules.entries()) {
      if (rule.output && typeof rule.output === 'string') {
        if (outputNames.has(rule.output)) {
          throw new NodeValidationError(
            node.id,
            node.type,
            `Duplicate output port name "${rule.output}" in rules at index ${index}`,
          );
        }
        outputNames.add(rule.output);
      }
    }
  }
}

function getSwitchOutputPorts(node: WorkflowNode): string[] {
  const rules = node.parameters['rules'] as { output: string }[] | undefined;
  const outputs = new Set<string>();

  if (rules && Array.isArray(rules)) {
    for (const rule of rules) {
      if (rule.output && typeof rule.output === 'string') {
        outputs.add(rule.output);
      }
    }
  }

  const defaultOutput =
    (node.parameters['defaultOutput'] as string) ?? 'default';
  outputs.add(defaultOutput);

  return Array.from(outputs);
}

async function executeSwitchNode(
  node: WorkflowNode,
  input: TypedField[][],
): Promise<Record<string, TypedField[][]>> {
  const rules = node.parameters['rules'] as {
    condition: Condition;
    output: string;
  }[];
  const defaultOutput =
    (node.parameters['defaultOutput'] as string) ?? 'default';

  // Initialize output batches for each output port
  const outputBatches: Record<string, TypedField[][]> = {};
  for (const rule of rules) {
    if (rule.output && typeof rule.output === 'string') {
      outputBatches[rule.output] = [];
    }
  }
  outputBatches[defaultOutput] = [];

  for (const inputItem of input) {
    const outputItems: Record<string, TypedField[]> = {};
    for (const rule of rules) {
      if (rule.output && typeof rule.output === 'string') {
        outputItems[rule.output] = [];
      }
    }
    outputItems[defaultOutput] = [];

    for (const inputField of inputItem) {
      if (!inputField) {
        throw new NodeExecutionError(
          node.id,
          'Switch node received undefined or null input field',
        );
      }

      // Check rules in order - first match wins
      let matched = false;
      for (const rule of rules) {
        const matches = await evaluateCondition(inputField, rule.condition);
        if (matches) {
          const outputPort = rule.output;
          outputItems[outputPort] ??= [];
          outputItems[outputPort].push(inputField);
          matched = true;
          break;
        }
      }

      // If no rule matched, send to default
      if (!matched) {
        outputItems[defaultOutput].push(inputField);
      }
    }

    // Add non-empty batches
    for (const [outputPort, items] of Object.entries(outputItems)) {
      if (items.length > 0) {
        outputBatches[outputPort] ??= [];
        outputBatches[outputPort].push(items);
      }
    }
  }

  return outputBatches;
}

const parametersExamples: ParametersExample[] = [
  {
    title: 'Route by Priority',
    description:
      'Route items to different outputs based on priority level. High priority items go to "high" port, medium to "medium" port, others to "default" port.',
    parameters: {
      rules: [
        {
          condition: {
            path: 'priority',
            value: 'high',
            operator: 'equals',
          },
          output: 'high',
        },
        {
          condition: {
            path: 'priority',
            value: 'medium',
            operator: 'equals',
          },
          output: 'medium',
        },
      ],
      defaultOutput: 'low',
    },
  },
  {
    title: 'Route by Status',
    description:
      'Route items based on status field. Active items go to "active" port, inactive to "inactive" port, others to "default" port.',
    parameters: {
      rules: [
        {
          condition: {
            path: 'status',
            value: 'active',
            operator: 'equals',
          },
          output: 'active',
        },
        {
          condition: {
            path: 'status',
            value: 'inactive',
            operator: 'equals',
          },
          output: 'inactive',
        },
      ],
      defaultOutput: 'unknown',
    },
  },
  {
    title: 'Route by Email Domain',
    description:
      'Route items based on email domain. Items with "@example.com" go to "internal" port, others to "external" port.',
    parameters: {
      rules: [
        {
          condition: {
            path: 'user.email',
            value: '@example.com',
            operator: 'contains',
          },
          output: 'internal',
        },
      ],
      defaultOutput: 'external',
    },
  },
];

export const switchNodePlugin: NodePlugin = {
  nodeType: 'builtIn.switch',
  name: 'Switch',
  purpose:
    'Multi-branch conditional routing node that routes data items to different output ports based on multiple conditions. Rules are evaluated in order, and the first matching rule determines the output port. Items that match no rules are routed to the default output.',
  useCases: [
    'Multi-branch conditional routing',
    'Complex decision trees',
    'Categorizing data into multiple buckets',
    'Priority-based routing',
    'Status-based workflow branching',
  ],
  outputPorts: ['default'], // Default/fallback outputs
  dynamicOutputsAllowed: true, // Explicit flag for dynamic outputs
  getOutputPorts: getSwitchOutputPorts, // Function to get dynamic outputs
  getParameterSchema: () =>
    serializeParameterSchema(SwitchNodeParametersSchema),
  validate: validateSwitchNodeParameters,
  execute: executeSwitchNode,
  parametersExamples,
};
