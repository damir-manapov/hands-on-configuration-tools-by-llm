import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import type { TypedField } from '../../types.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';

const StartNodeParametersSchema = z.object({});

function validateStartNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, StartNodeParametersSchema);
}

function executeStartNode(
  _node: WorkflowNode,
  _input: TypedField[][],
): TypedField[][] {
  return [[]];
}

export const startNodePlugin: NodePlugin = {
  nodeType: 'builtIn.start',
  name: 'Start',
  purpose:
    'Entry point for workflows. Initializes workflow execution with empty data.',
  useCases: [
    'Starting a workflow execution',
    'Creating the initial data context for a workflow',
    'Defining workflow entry points',
  ],
  getParameterSchema: () => serializeParameterSchema(StartNodeParametersSchema),
  validate: validateStartNodeParameters,
  execute: executeStartNode,
};
