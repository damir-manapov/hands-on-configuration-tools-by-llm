import { z } from 'zod';
import type { TypedField } from '../../types.js';
import { getNestedFieldValue } from './get-nested-field-value.js';
import { IncomparableFieldValueError } from '../../errors/index.js';

/**
 * Schema for condition parameters used in if and filter nodes.
 */
export const ConditionSchema = z.object({
  path: z
    .string()
    .describe(
      'The field path from the input data to evaluate. Supports nested fields using dot notation (e.g., "user.name" or "address.city"). The value of this field will be compared against value.',
    ),
  value: z
    .string()
    .describe(
      'The value to compare against. This is a static string value that will be compared with the field specified in path.',
    ),
  operator: z
    .enum(['equals', 'notEquals', 'contains'])
    .describe(
      'The comparison operator: "equals" for exact match, "notEquals" for non-match, "contains" to check if the value at path contains value as a substring.',
    ),
});

export type Condition = z.infer<typeof ConditionSchema>;

/**
 * Evaluates a condition against a TypedField item.
 * Extracts the value at the specified path and compares it with the condition value
 * using the specified operator.
 *
 * @param item - The TypedField item to evaluate the condition against
 * @param condition - The condition to evaluate (path, value, operator)
 * @returns true if the condition matches, false otherwise
 * @throws {FieldNotFoundError} When the field at the specified path doesn't exist
 * @throws {NullFieldError} When the field at the specified path is null or undefined
 * @throws {ResolverRequiredError} When a resolver is required but not provided
 * @throws {ResolverFailedError} When a resolver returns an invalid value
 * @throws {CannotTraverseError} When a primitive value cannot be traversed
 * @throws {IncomparableFieldValueError} When the field value is not a comparable primitive (object/array)
 *
 * @example
 * ```ts
 * const item: TypedField = {
 *   value: { status: { value: 'active', kind: 'primitive' } },
 *   kind: 'primitive'
 * };
 * const condition = { path: 'status', value: 'active', operator: 'equals' };
 * const matches = await evaluateCondition(item, condition);
 * // Returns: true
 * ```
 */
export async function evaluateCondition(
  item: TypedField,
  condition: Condition,
): Promise<boolean> {
  const field = await getNestedFieldValue(item, condition.path);
  const pathValueRaw = field.value;

  // Check if value is a comparable primitive type
  if (
    pathValueRaw !== null &&
    pathValueRaw !== undefined &&
    typeof pathValueRaw !== 'string' &&
    typeof pathValueRaw !== 'number' &&
    typeof pathValueRaw !== 'boolean'
  ) {
    const valueType = Array.isArray(pathValueRaw)
      ? 'array'
      : typeof pathValueRaw === 'object'
        ? 'object'
        : typeof pathValueRaw;

    throw new IncomparableFieldValueError(
      condition.path,
      condition.path.split('.').pop() ?? condition.path,
      valueType,
    );
  }

  const pathValue =
    pathValueRaw === null || pathValueRaw === undefined
      ? ''
      : String(pathValueRaw);
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return pathValue === compareValue;
    case 'notEquals':
      return pathValue !== compareValue;
    case 'contains':
      return pathValue.includes(compareValue);
    default:
      return false;
  }
}
