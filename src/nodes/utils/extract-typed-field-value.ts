import type { TypedField } from '../../types.js';

/**
 * Extracts the plain value from a TypedField.
 * If the TypedField's value is a Record<string, TypedField>, it recursively
 * extracts the plain values from nested TypedFields.
 *
 * @param field - The TypedField to extract
 * @returns The extracted plain value
 *
 * @example
 * ```ts
 * const field: TypedField = {
 *   value: {
 *     name: { value: 'John', kind: 'primitive' },
 *     age: { value: 30, kind: 'primitive' }
 *   },
 *   kind: 'primitive'
 * };
 * const extracted = extractTypedFieldValue(field);
 * // Result: { name: 'John', age: 30 }
 * ```
 */
export function extractTypedFieldValue(field: TypedField): unknown {
  const value = field.value;

  // Handle primitives, null, undefined - return as-is
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  // Handle arrays - extract TypedField values from each element
  if (Array.isArray(value)) {
    return value.map((item: unknown): unknown => {
      // Check if array element is a TypedField
      if (
        item &&
        typeof item === 'object' &&
        'value' in item &&
        'kind' in item
      ) {
        return extractTypedFieldValue(item as TypedField);
      }

      // Plain value in array, return as-is
      return item;
    });
  }

  // Value is an object - check if it's Record<string, TypedField> or plain object
  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(obj)) {
    // Check if nested value is a TypedField
    if (
      nestedValue &&
      typeof nestedValue === 'object' &&
      'value' in nestedValue &&
      'kind' in nestedValue
    ) {
      result[key] = extractTypedFieldValue(nestedValue as TypedField);
    } else {
      // Plain value, return as-is
      result[key] = nestedValue;
    }
  }

  return result;
}
