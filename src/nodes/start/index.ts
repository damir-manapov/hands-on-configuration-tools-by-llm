import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import { validateNodeParameters } from '../validate.js';

const StartNodeParametersSchema = z.object({});

export function validateStartNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, StartNodeParametersSchema);
}

export function executeStartNode(
  _node: WorkflowNode,
  _input: unknown[][],
): unknown[][] {
  return [[]];
}
