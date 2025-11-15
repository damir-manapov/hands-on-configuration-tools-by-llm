import type { WorkflowNode, TypedField, FieldResolver } from './types.js';
import type { SerializableParameterSchema } from './schema-serializer.js';

export interface NodePlugin {
  nodeType: string;
  name: string;
  purpose: string;
  useCases: string[];
  getParameterSchema: () => SerializableParameterSchema;
  validate: (node: WorkflowNode) => void;
  execute: (
    node: WorkflowNode,
    input: TypedField[][],
    resolver?: FieldResolver,
  ) => Promise<TypedField[][]> | TypedField[][];
}
