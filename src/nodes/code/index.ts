import { z } from 'zod';
import { VM } from 'vm2';
import { parse } from 'acorn';
import type { WorkflowNode, FieldResolver, TypedField } from '../../types.js';
import type { NodePlugin, ParametersExample } from '../../plugin.js';
import { validateNodeParameters } from '../validate.js';
import { serializeParameterSchema } from '../../schema-serializer.js';
import { NodeExecutionError } from '../../errors/index.js';
import {
  CodeExecutionTimeoutError,
  CodeExecutionError,
  CodeInvalidReturnFormatError,
  CodeResolverNotAvailableError,
} from './errors.js';
import { extractTypedFieldValue } from '../utils/extract-typed-field-value.js';
import { convertValueToTypedField } from '../utils/convert-value-to-typed-field.js';
import { resolveLinkField } from '../utils/resolve-link-field.js';
import { validateTypedField } from '../utils/validate-typed-field.js';

const CodeNodeParametersSchema = z.object({
  code: z
    .string()
    .min(1, 'Code parameter is required and cannot be empty')
    .refine((val) => val.trim().length > 0, {
      message: 'Code parameter cannot be only whitespace',
    })
    .describe(
      'JavaScript code to execute. The code receives a single TypedField as the "item" variable and should return a single TypedField. Utility functions: extractValue(field) to get plain value, toTypedField(value) to convert to TypedField, resolve(field) to resolve link fields.',
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

  const code = node.parameters['code'] as string;
  try {
    // Validate JavaScript syntax using acorn
    // Wrap code the same way as in execution: (function() { ${code} })()
    const wrappedCode = `
      (function() {
        ${code}
      })()
    `;
    parse(wrappedCode, { ecmaVersion: 'latest', sourceType: 'script' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new NodeExecutionError(node.id, `Code syntax error: ${errorMessage}`);
  }
}

/**
 * Checks if an error is a timeout error based on its message
 */
function isTimeoutError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes('Script execution timed out') ||
    errorMessage.includes('timed out') ||
    errorMessage.toLowerCase().includes('timeout')
  );
}

async function executeCodeNode(
  node: WorkflowNode,
  input: TypedField[][],
  resolver?: FieldResolver,
): Promise<TypedField[][]> {
  const code = node.parameters['code'] as string;
  const timeout = (node.parameters['timeout'] as number) ?? 5000;

  // Create utility functions once (they don't depend on the item)
  const extractValueFn = (field: unknown): unknown => {
    try {
      validateTypedField(field);
    } catch (error) {
      throw new CodeExecutionError(
        node.id,
        `extractValue expects a TypedField object: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return extractTypedFieldValue(field as TypedField);
  };

  const toTypedFieldFn = (value: unknown): TypedField => {
    return convertValueToTypedField(value);
  };

  const resolveFn = async (
    field: unknown,
  ): Promise<Record<string, TypedField>> => {
    try {
      validateTypedField(field);
    } catch (error) {
      throw new CodeExecutionError(
        node.id,
        `resolve expects a TypedField object: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    const typedField = field as TypedField;
    if (!resolver) {
      throw new CodeResolverNotAvailableError(node.id);
    }
    return await resolveLinkField(typedField, resolver);
  };

  // Serialize all input items into the code string
  // We'll construct a single code that processes all items in one vm.run() call
  const inputItemsCode = input
    .map((batch) => `[${batch.map((item) => JSON.stringify(item)).join(', ')}]`)
    .join(', ');

  // Construct the complete code that processes all items
  // This code will be compiled and executed once
  // Note: User code might return a Promise, so we need to handle async execution
  const completeCode = `
    (async function() {
      const inputBatches = [${inputItemsCode}];
      const results = [];
      
      for (let batchIndex = 0; batchIndex < inputBatches.length; batchIndex++) {
        const batch = inputBatches[batchIndex];
        const batchResults = [];
        
        for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
          const item = batch[itemIndex];
          
          // User's code - it has access to 'item' variable and should return a TypedField
          // It might return a Promise, so we await it
          const result = await (async function() {
            ${code}
          })();
          
          batchResults.push(result);
        }
        
        results.push(batchResults);
      }
      
      return results;
    })()
  `;

  // Create VM once with utility functions
  const sandbox = {
    // Utility functions
    extractValue: extractValueFn,
    toTypedField: toTypedFieldFn,
    resolve: resolveFn,
    // Provide safe utilities
    Math,
    JSON,
    Date,
  };

  const vm = new VM({
    timeout,
    sandbox,
  });

  // Execute all items in a single vm.run() call - code is compiled only once!
  try {
    const result = vm.run(completeCode) as unknown;

    // Handle Promise result (user code might return a Promise)
    const resolvedResult = await Promise.resolve(result);

    // Validate result structure
    if (!Array.isArray(resolvedResult)) {
      throw new CodeInvalidReturnFormatError(
        node.id,
        'Code must return an array of arrays (batches)',
      );
    }

    // Validate that all items are TypedField objects
    const typedResult = resolvedResult as unknown[][];
    for (const [i, batch] of typedResult.entries()) {
      if (!Array.isArray(batch)) {
        throw new CodeInvalidReturnFormatError(
          node.id,
          `Result at batch index ${i} is not an array`,
        );
      }
      for (const [j, item] of batch.entries()) {
        try {
          validateTypedField(item);
        } catch (validationError) {
          const errorDetails =
            validationError instanceof Error
              ? validationError.message
              : String(validationError);
          throw new CodeInvalidReturnFormatError(
            node.id,
            `Code must return a TypedField object. Invalid result at batch [${i}], item [${j}]: ${errorDetails}`,
          );
        }
      }
    }

    return typedResult as TypedField[][];
  } catch (error) {
    // Handle errors from code execution, converting them to appropriate error types
    // Re-throw our custom errors as-is (they already have the correct type and context)
    if (error instanceof NodeExecutionError && error.nodeId === node.id) {
      throw error;
    }
    // Handle generic errors - convert timeout errors and other errors appropriately
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isTimeoutError(error)) {
      throw new CodeExecutionTimeoutError(node.id, timeout);
    }
    throw new CodeExecutionError(node.id, errorMessage);
  }
}

const parametersExamples: ParametersExample[] = [
  {
    title: 'Simple Field Extraction',
    description:
      'Extract a single field value from the item and return it as a new TypedField. Uses extractValue() to get the plain value from nested fields.',
    parameters: {
      code: `const status = extractValue(item.value.status);
return toTypedField(status);`,
      timeout: 5000,
    },
  },
  {
    title: 'Transform and Add Field',
    description:
      'Transform the item by adding a new computed field. Accesses nested fields and creates a new object with additional computed values.',
    parameters: {
      code: `const name = extractValue(item.value.name);
const email = extractValue(item.value.email);
const fullInfo = \`\${name} <\${email}>\`;
return toTypedField({ ...item.value, fullInfo: toTypedField(fullInfo) });`,
      timeout: 5000,
    },
  },
  {
    title: 'Custom Timeout',
    description:
      'Execute code with a custom timeout of 10 seconds. Useful for code that performs complex calculations or data processing.',
    parameters: {
      code: `// Complex calculation
let sum = 0;
for (let i = 0; i < 1000000; i++) {
  sum += i;
}
return toTypedField(sum);`,
      timeout: 10000,
    },
  },
];

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
  execute: (
    node: WorkflowNode,
    input: TypedField[][],
    resolver?: FieldResolver,
  ) => executeCodeNode(node, input, resolver),
  parametersExamples,
};

// Export error classes for use by consumers
export {
  CodeExecutionTimeoutError,
  CodeExecutionError,
  CodeInvalidReturnFormatError,
  CodeResolverNotAvailableError,
} from './errors.js';
