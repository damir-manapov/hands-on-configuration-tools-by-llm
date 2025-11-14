import { z } from 'zod';
import { VM } from 'vm2';
import type { WorkflowNode } from '../../types.js';
import type { NodePlugin } from '../../plugin.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';
import {
  CodeExecutionTimeoutError,
  CodeExecutionError,
  CodeInvalidReturnFormatError,
} from './errors.js';

const CodeNodeParametersSchema = z.object({
  code: z
    .string()
    .describe(
      'JavaScript code to execute. The code should return an array of arrays, where each inner array represents an output item. The input data is available as the "input" variable (array of arrays).',
    ),
  timeout: z
    .number()
    .optional()
    .default(5000)
    .describe(
      'Maximum execution time in milliseconds. Code execution will be terminated if it exceeds this timeout.',
    ),
});

function validateCodeNodeParameters(node: WorkflowNode): void {
  validateNodeParameters(node, CodeNodeParametersSchema);
}

function executeCodeNode(
  node: WorkflowNode,
  input: unknown[][],
): Promise<unknown[][]> {
  const code = (node.parameters['code'] as string) ?? '';
  const timeout = (node.parameters['timeout'] as number) ?? 5000;

  if (!code.trim()) {
    // If no code provided, pass through input unchanged
    return Promise.resolve(input);
  }

  return new Promise((resolve, reject) => {
    try {
      const vm = new VM({
        timeout,
        sandbox: {
          input,
          // Provide safe utilities
          Math,
          JSON,
          Date,
          // Block dangerous APIs - no require, no process, no fs, etc.
        },
      });

      const result = vm.run(`
        (function() {
          ${code}
        })()
      `) as unknown;

      // Validate result is an array of arrays
      if (!Array.isArray(result)) {
        throw new CodeInvalidReturnFormatError(node.id);
      }

      for (const item of result) {
        if (!Array.isArray(item)) {
          throw new CodeInvalidReturnFormatError(node.id);
        }
      }

      resolve(result as unknown[][]);
    } catch (error) {
      if (error instanceof CodeInvalidReturnFormatError) {
        reject(error);
      } else {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const isTimeoutError =
          errorMessage.includes('Script execution timed out') ||
          errorMessage.includes('timed out') ||
          errorMessage.toLowerCase().includes('timeout');
        if (isTimeoutError) {
          reject(new CodeExecutionTimeoutError(node.id, timeout));
        } else {
          reject(new CodeExecutionError(node.id, errorMessage));
        }
      }
    }
  });
}

export const codeNodePlugin: NodePlugin = {
  nodeType: 'builtIn.code',
  name: 'Code',
  purpose:
    'Execute custom JavaScript code to transform data. Provides access to input data and safe JavaScript utilities.',
  useCases: [
    'Custom data transformations',
    'Complex calculations',
    'Data manipulation not possible with other nodes',
    'Custom business logic implementation',
  ],
  getParameterSchema: () => serializeParameterSchema(CodeNodeParametersSchema),
  validate: validateCodeNodeParameters,
  execute: executeCodeNode,
};

// Export error classes for use by consumers
export {
  CodeExecutionTimeoutError,
  CodeExecutionError,
  CodeInvalidReturnFormatError,
} from './errors.js';
