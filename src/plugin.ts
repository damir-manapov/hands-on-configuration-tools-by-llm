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
  outputPorts: string[]; // Static output port names (or defaults for dynamic nodes)
  dynamicOutputsAllowed: boolean; // If true, output ports are determined dynamically based on node parameters
  getOutputPorts?: (node: WorkflowNode) => string[]; // Function to get dynamic output ports (required if dynamicOutputsAllowed is true)
  getParameterSchema: () => SerializableParameterSchema;
  validate: (node: WorkflowNode) => void;
  execute: (
    node: WorkflowNode,
    input: TypedField[][],
    resolver?: FieldResolver,
  ) => Promise<Record<string, TypedField[][]>> | Record<string, TypedField[][]>;
  parametersExamples: ParametersExample[];
}
