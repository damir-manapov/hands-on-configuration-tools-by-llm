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
