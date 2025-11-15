import type { TypedField } from '../../types.js';
import { extractTypedFieldValue } from './extract-typed-field-value.js';

/**
 * Extracts all values from a TypedField[][] structure for test comparisons.
 * Converts the nested TypedField structure to plain values recursively.
 *
 * This is a convenience function for tests that need to compare TypedField[][]
 * results with plain object structures.
 *
 * @param result - The TypedField[][] structure to extract values from
 * @returns A nested array of plain values (unknown[][])
 *
 * @example
 * ```ts
 * const result: TypedField[][] = [
 *   [
 *     { value: { name: { value: 'John', kind: 'primitive' } }, kind: 'primitive' }
 *   ]
 * ];
 * const extracted = extractTypedFieldResult(result);
 * // Result: [[{ name: 'John' }]]
 * ```
 */
export function extractTypedFieldResult(result: TypedField[][]): unknown[][] {
  return result.map((item) =>
    item.map((field) => extractTypedFieldValue(field)),
  );
}
