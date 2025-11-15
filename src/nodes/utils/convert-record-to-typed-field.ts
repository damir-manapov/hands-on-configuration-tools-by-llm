import type { TypedField } from '../../types.js';
import { convertValueToTypedField } from './convert-value-to-typed-field.js';

/**
 * Converts a plain object Record to TypedField format.
 * Transforms a Record<string, unknown> into a TypedField where the value is a Record<string, TypedField>
 * with each field wrapped with type information. Uses convertValueToTypedField to recursively convert
 * nested objects and arrays to TypedFields.
 *
 * @param data - Plain object with string keys and unknown values
 * @returns TypedField with value being a Record<string, TypedField> where each field has kind 'primitive'
 *
 * @example
 * ```ts
 * const data = { name: 'John', age: 30 };
 * const typed = convertRecordToTypedField(data);
 * // Result: {
 * //   value: {
 * //     name: { value: 'John', kind: 'primitive' },
 * //     age: { value: 30, kind: 'primitive' }
 * //   },
 * //   kind: 'primitive'
 * // }
 * ```
 *
 * @example
 * ```ts
 * // Nested objects are recursively converted:
 * const data = { user: { name: 'John', age: 30 } };
 * const typed = convertRecordToTypedField(data);
 * // Result: {
 * //   value: {
 * //     user: {
 * //       value: {
 * //         name: { value: 'John', kind: 'primitive' },
 * //         age: { value: 30, kind: 'primitive' }
 * //       },
 * //       kind: 'primitive'
 * //     }
 * //   },
 * //   kind: 'primitive'
 * // }
 * ```
 *
 * @example
 * ```ts
 * // Arrays are recursively converted, including arrays of objects:
 * const data = {
 *   tags: ['tag1', 'tag2'],
 *   users: [{ name: 'John' }, { name: 'Jane' }]
 * };
 * const typed = convertRecordToTypedField(data);
 * // Result: {
 * //   value: {
 * //     tags: {
 * //       value: [
 * //         { value: 'tag1', kind: 'primitive' },
 * //         { value: 'tag2', kind: 'primitive' }
 * //       ],
 * //       kind: 'primitive'
 * //     },
 * //     users: {
 * //       value: [
 * //         { value: { name: { value: 'John', kind: 'primitive' } }, kind: 'primitive' },
 * //         { value: { name: { value: 'Jane', kind: 'primitive' } }, kind: 'primitive' }
 * //       ],
 * //       kind: 'primitive'
 * //     }
 * //   },
 * //   kind: 'primitive'
 * // }
 * ```
 */

export function convertRecordToTypedField(
  data: Record<string, unknown>,
): TypedField {
  const result: Record<string, TypedField> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = convertValueToTypedField(value);
  }
  return {
    value: result,
    kind: 'primitive',
  };
}
