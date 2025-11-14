import { z } from 'zod';
import type { WorkflowNode } from '../types.js';
import { NodeValidationError } from '../errors.js';

export function validateNodeParameters(
  node: WorkflowNode,
  schema: z.ZodType<unknown>,
): void {
  try {
    schema.parse(node.parameters);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
          return `${path}: ${issue.message}`;
        })
        .join('; ');
      throw new NodeValidationError(node.id, node.type, issues);
    }
    throw error;
  }
}
