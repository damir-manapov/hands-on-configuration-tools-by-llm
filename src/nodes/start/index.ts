import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import { validateNodeParameters } from '../validate.js';

const StartNodeParametersSchema = z.object({});

function validateStartNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, StartNodeParametersSchema);
}

function executeStartNode(
  _node: WorkflowNode,
  _input: unknown[][],
): unknown[][] {
  return [[]];
}

export const startNodePlugin: NodePlugin = {
  nodeType: 'builtIn.start',
  validate: validateStartNodeParameters,
  execute: executeStartNode,
};
