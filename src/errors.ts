export class WorkflowNotFoundError extends Error {
  constructor(workflowId: string) {
    super(`Workflow with id ${workflowId} not found`);
    this.name = 'WorkflowNotFoundError';
  }
}

export class WorkflowAlreadyExistsError extends Error {
  constructor(workflowId: string) {
    super(`Workflow with id ${workflowId} already exists`);
    this.name = 'WorkflowAlreadyExistsError';
  }
}

export class WorkflowNotActiveError extends Error {
  constructor(workflowId: string) {
    super(`Workflow ${workflowId} is not active`);
    this.name = 'WorkflowNotActiveError';
  }
}

export class WorkflowValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowValidationError';
  }
}

export class NodeNotFoundError extends Error {
  constructor(nodeId: string, workflowId: string) {
    super(`Node with id ${nodeId} not found in workflow ${workflowId}`);
    this.name = 'NodeNotFoundError';
  }
}

export class NodeValidationError extends Error {
  constructor(nodeId: string, nodeType: string, issues: string) {
    super(
      `Node ${nodeId} (type: ${nodeType}) has invalid parameters: ${issues}`,
    );
    this.name = 'NodeValidationError';
  }
}

export class NodeTypeError extends Error {
  constructor(nodeId: string, nodeType: string, validTypes: readonly string[]) {
    super(
      `Node ${nodeId} has invalid type "${nodeType}". Valid types are: ${validTypes.join(', ')}`,
    );
    this.name = 'NodeTypeError';
  }
}

export class DuplicateNodeIdError extends Error {
  constructor(nodeId: string) {
    super(`Duplicate node id: ${nodeId}`);
    this.name = 'DuplicateNodeIdError';
  }
}

export class UnknownNodeTypeError extends Error {
  constructor(nodeId: string, nodeType: string, context: string) {
    super(
      `Unknown node type "${nodeType}" for node ${nodeId} during ${context}. This should not happen.`,
    );
    this.name = 'UnknownNodeTypeError';
  }
}

export class NodeTypeAlreadyRegisteredError extends Error {
  constructor(nodeType: string) {
    super(`Node type "${nodeType}" is already registered`);
    this.name = 'NodeTypeAlreadyRegisteredError';
  }
}

export class CannotUnregisterBuiltInNodeError extends Error {
  constructor(nodeType: string) {
    super(`Cannot unregister built-in node type "${nodeType}"`);
    this.name = 'CannotUnregisterBuiltInNodeError';
  }
}

export class NodeExecutionError extends Error {
  public readonly nodeId: string;

  constructor(nodeId: string, message: string) {
    super(message);
    this.name = 'NodeExecutionError';
    this.nodeId = nodeId;
  }
}
