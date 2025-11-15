import { NodeExecutionError } from '../../errors/index.js';

export class CodeExecutionTimeoutError extends NodeExecutionError {
  public readonly timeout: number;

  constructor(nodeId: string, timeout: number) {
    super(
      nodeId,
      `Code execution in node ${nodeId} exceeded timeout of ${timeout}ms`,
    );
    this.name = 'CodeExecutionTimeoutError';
    this.timeout = timeout;
  }
}

export class CodeExecutionError extends NodeExecutionError {
  constructor(nodeId: string, errorMessage: string) {
    super(nodeId, `Code execution error in node ${nodeId}: ${errorMessage}`);
    this.name = 'CodeExecutionError';
  }
}

export class CodeInvalidReturnFormatError extends NodeExecutionError {
  constructor(nodeId: string, message?: string) {
    super(
      nodeId,
      message ?? `Code in node ${nodeId} must return a TypedField object.`,
    );
    this.name = 'CodeInvalidReturnFormatError';
  }
}

export class CodeResolverNotAvailableError extends NodeExecutionError {
  constructor(nodeId: string) {
    super(
      nodeId,
      `Resolver is not available in node ${nodeId}. Provide a resolver function to resolve link fields.`,
    );
    this.name = 'CodeResolverNotAvailableError';
  }
}
