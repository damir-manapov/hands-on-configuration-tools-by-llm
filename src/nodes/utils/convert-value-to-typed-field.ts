import type { TypedField } from '../../types.js';
import { convertRecordToTypedField } from './convert-record-to-typed-field.js';

/**
 * Converts a single value to TypedField format.
 * Handles primitives, arrays, and objects. Recursively converts nested structures.
 *
 * @param value - The value to convert (can be primitive, array, or object)
 * @returns TypedField wrapping the converted value
 *
 * @example
 * ```ts
 * // Primitive values
 * convertValueToTypedField('hello');
 * // Result: { value: 'hello', kind: 'primitive' }
 * ```
 *
 * @example
 * ```ts
 * // Arrays
 * convertValueToTypedField([1, 2, 3]);
 * // Result: {
 * //   value: [
 * //     { value: 1, kind: 'primitive' },
 * //     { value: 2, kind: 'primitive' },
 * //     { value: 3, kind: 'primitive' }
 * //   ],
 * //   kind: 'primitive'
 * // }
 * ```
 *
 * @example
 * ```ts
 * // Objects (delegates to convertRecordToTypedField)
 * convertValueToTypedField({ name: 'John' });
 * // Result: {
 * //   value: {
 * //     name: { value: 'John', kind: 'primitive' }
 * //   },
 * //   kind: 'primitive'
 * // }
 * ```
 */
export function convertValueToTypedField(value: unknown): TypedField {
  if (value === null || typeof value !== 'object') {
    // Primitive values (string, number, boolean, null, undefined)
    return {
      value,
      kind: 'primitive',
    };
  }
  if (Array.isArray(value)) {
    // Arrays: recursively convert each element
    return {
      value: value.map((item: unknown) => convertValueToTypedField(item)),
      kind: 'primitive',
    };
  }
  // Plain object: recursively convert it using convertRecordToTypedField
  return convertRecordToTypedField(value as Record<string, unknown>);
}
