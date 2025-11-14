import { z } from 'zod';
import type { WorkflowNode } from './types.js';

export interface NodePlugin {
  nodeType: string;
  name: string;
  purpose: string;
  useCases: string[];
  getParameterSchema: () => z.ZodType<unknown>;
  validate: (node: WorkflowNode) => void;
  execute: (
    node: WorkflowNode,
    input: unknown[][],
  ) => Promise<unknown[][]> | unknown[][];
}

