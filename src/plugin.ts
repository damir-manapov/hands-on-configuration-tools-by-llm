import type { WorkflowNode, TypedField, FieldResolver } from './types.js';
import type { SerializableParameterSchema } from './schema-serializer.js';

export interface ParametersExample {
  title: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface NodePlugin {
  nodeType: string;
  name: string;
  purpose: string;
  useCases: string[];
  outputPorts: string[]; // List of allowed output port names (e.g., ['main'], ['true', 'false'])
  getParameterSchema: () => SerializableParameterSchema;
  validate: (node: WorkflowNode) => void;
  execute: (
    node: WorkflowNode,
    input: TypedField[][],
    resolver?: FieldResolver,
  ) => Promise<Record<string, TypedField[][]>> | Record<string, TypedField[][]>;
  parametersExamples: ParametersExample[];
}
