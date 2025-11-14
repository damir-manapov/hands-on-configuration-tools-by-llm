import type { WorkflowNode } from './types.js';

export interface NodePlugin {
  nodeType: string;
  validate: (node: WorkflowNode) => void;
  execute: (
    node: WorkflowNode,
    input: unknown[][],
  ) => Promise<unknown[][]> | unknown[][];
}

