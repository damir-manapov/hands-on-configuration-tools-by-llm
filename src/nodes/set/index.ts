import { z } from 'zod';
import type { WorkflowNode } from '../../types.js';
import { validateNodeParameters } from '../validate.js';

const SetNodeValueSchema = z.object({
  name: z.string(),
  value: z.string(),
});

const SetNodeParametersSchema = z.object({
  values: z.array(SetNodeValueSchema),
});

export function validateSetNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, SetNodeParametersSchema);
}

export function executeSetNode(
  node: WorkflowNode,
  input: unknown[][],
): unknown[][] {
  const values =
    (node.parameters['values'] as { name: string; value: string }[]) ?? [];
  const result: unknown[][] = [];

  for (const inputItem of input) {
    const outputItem: Record<string, unknown> = {
      ...(inputItem[0] as Record<string, unknown>),
    };
    for (const value of values) {
      outputItem[value.name] = value.value;
    }
    result.push([outputItem]);
  }

  return result;
}
