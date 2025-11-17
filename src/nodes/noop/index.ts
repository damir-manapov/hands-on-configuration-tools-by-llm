import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin, ParametersExample } from '../../plugin.js';
import type { TypedField } from '../../types.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';

const NoopNodeParametersSchema = z.object({});

function validateNoopNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, NoopNodeParametersSchema);
}

function executeNoopNode(
  _node: WorkflowNode,
  input: TypedField[][],
): Record<string, TypedField[][]> {
  // No-op: just pass through the input unchanged
  return {
    main: input,
  };
}

const parametersExamples: ParametersExample[] = [
  {
    title: 'Basic Noop Node',
    description:
      'A no-operation node that passes through input data unchanged. Useful as a placeholder or entry point.',
    parameters: {},
  },
];

export const noopNodePlugin: NodePlugin = {
  nodeType: 'builtIn.noop',
  name: 'Noop',
  purpose:
    'No-operation node that passes through input data unchanged. Useful as a placeholder or entry point for workflows.',
  useCases: [
    'Creating workflow entry points',
    'Placeholder nodes during workflow design',
    'Passing through data without modification',
  ],
  outputPorts: ['main'],
  dynamicOutputsAllowed: false,
  getParameterSchema: () => serializeParameterSchema(NoopNodeParametersSchema),
  validate: validateNoopNodeParameters,
  execute: executeNoopNode,
  parametersExamples,
};
