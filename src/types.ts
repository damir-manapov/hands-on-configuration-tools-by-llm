export interface NodeConfig {
  id: string;
  name: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  parameters: Record<string, unknown>;
}

export interface Connection {
  node: string;
  type: string;
  index: number;
}

export interface WorkflowNode extends NodeConfig {
  connections: Record<string, Connection[][]>;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  connections: Record<string, Connection[]>;
  active: boolean;
}

export type ExecutionData = Record<string, unknown[][]>;

export interface ExecutionResult {
  data: ExecutionData;
  finished: boolean;
  error?: Error;
}
