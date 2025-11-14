import { NodeExecutionError } from '../../errors.js';

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
  constructor(nodeId: string) {
    super(
      nodeId,
      `Code in node ${nodeId} must return an array of arrays. Each inner array represents an output item.`,
    );
    this.name = 'CodeInvalidReturnFormatError';
  }
}
