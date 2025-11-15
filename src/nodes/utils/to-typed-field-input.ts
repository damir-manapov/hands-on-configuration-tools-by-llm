import type { TypedField } from '../../types.js';
import { convertRecordToTypedField } from './convert-record-to-typed-field.js';

/**
 * Converts plain object arrays to TypedField[][] format.
 * Each item in the input array is wrapped as a TypedField with value being
 * a Record<string, TypedField>.
 *
 * @param input - Array of arrays of plain objects
 * @returns TypedField[][] where each item is wrapped as a TypedField
 *
 * @example
 * ```ts
 * // Simple example
 * const input = [[{ name: 'John' }], [{ name: 'Jane' }]];
 * const typed = toTypedFieldInput(input);
 * // Result: [
 * //   [{ value: { name: { value: 'John', kind: 'primitive' } }, kind: 'primitive' }],
 * //   [{ value: { name: { value: 'Jane', kind: 'primitive' } }, kind: 'primitive' }]
 * // ]
 * ```
 *
 * @example
 * ```ts
 * // Complex example with multiple fields, nested objects, and various data types
 * const input = [
 *   [
 *     {
 *       id: 1,
 *       name: 'John',
 *       age: 30,
 *       active: true,
 *       profile: { role: 'admin', department: 'IT' },
 *       tags: ['developer', 'senior']
 *     },
 *     {
 *       id: 2,
 *       name: 'Jane',
 *       age: 25,
 *       active: false,
 *       profile: { role: 'user', department: 'HR' }
 *     }
 *   ],
 *   [
 *     {
 *       id: 3,
 *       name: 'Bob',
 *       age: 35,
 *       active: true,
 *       profile: { role: 'manager', department: 'Sales' }
 *     }
 *   ]
 * ];
 * const typed = toTypedFieldInput(input);
 * // Result: [
 * //   [
 * //     {
 * //       value: {
 * //         id: { value: 1, kind: 'primitive' },
 * //         name: { value: 'John', kind: 'primitive' },
 * //         age: { value: 30, kind: 'primitive' },
 * //         active: { value: true, kind: 'primitive' },
 * //         profile: {
 * //           value: {
 * //             role: { value: 'admin', kind: 'primitive' },
 * //             department: { value: 'IT', kind: 'primitive' }
 * //           },
 * //           kind: 'primitive'
 * //         },
 * //         tags: { value: ['developer', 'senior'], kind: 'primitive' }
 * //       },
 * //       kind: 'primitive'
 * //     },
 * //     {
 * //       value: {
 * //         id: { value: 2, kind: 'primitive' },
 * //         name: { value: 'Jane', kind: 'primitive' },
 * //         age: { value: 25, kind: 'primitive' },
 * //         active: { value: false, kind: 'primitive' },
 * //         profile: {
 * //           value: {
 * //             role: { value: 'user', kind: 'primitive' },
 * //             department: { value: 'HR', kind: 'primitive' }
 * //           },
 * //           kind: 'primitive'
 * //         }
 * //       },
 * //       kind: 'primitive'
 * //     }
 * //   ],
 * //   [
 * //     {
 * //       value: {
 * //         id: { value: 3, kind: 'primitive' },
 * //         name: { value: 'Bob', kind: 'primitive' },
 * //         age: { value: 35, kind: 'primitive' },
 * //         active: { value: true, kind: 'primitive' },
 * //         profile: {
 * //           value: {
 * //             role: { value: 'manager', kind: 'primitive' },
 * //             department: { value: 'Sales', kind: 'primitive' }
 * //           },
 * //           kind: 'primitive'
 * //         }
 * //       },
 * //       kind: 'primitive'
 * //     }
 * //   ]
 * // ]
 * ```
 */
export function toTypedFieldInput(
  input: Record<string, unknown>[][],
): TypedField[][] {
  return input.map((itemArray) =>
    itemArray.map((item) => convertRecordToTypedField(item)),
  );
}
