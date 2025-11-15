import { z } from 'zod';
import type { TypedField } from '../../types.js';

/**
 * Zod schema for validating a TypedField structure recursively.
 * This schema ensures that if a TypedField's value is an object,
 * all its properties are also TypedField objects.
 */
const TypedFieldSchema: z.ZodType<TypedField> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({
      value: z.unknown(),
      kind: z.literal('link'),
      entity: z.string(),
    }),
    z.object({
      value: z.union([
        z.null(),
        z.undefined(),
        z.string(),
        z.number(),
        z.boolean(),
        z.array(TypedFieldSchema),
        z.record(z.string(), TypedFieldSchema),
      ]),
      kind: z.literal('primitive'),
    }),
  ]),
);

/**
 * Validates that a TypedField has TypedField objects all the way down recursively.
 * Ensures that if a TypedField's value is an object, all its properties are also TypedField objects.
 *
 * @param field - The TypedField to validate
 * @returns true if the TypedField structure is valid
 * @throws {z.ZodError} If the structure is invalid, with detailed error information including paths
 *
 * @example
 * ```ts
 * // Valid structure
 * const valid: TypedField = {
 *   value: {
 *     name: { value: 'John', kind: 'primitive' },
 *     age: { value: 30, kind: 'primitive' }
 *   },
 *   kind: 'primitive'
 * };
 * validateTypedField(valid); // Returns true
 *
 * // Invalid structure - nested object is not a TypedField
 * const invalid: TypedField = {
 *   value: {
 *     name: { value: 'John', kind: 'primitive' },
 *     profile: { name: 'John' } // Missing TypedField wrapper
 *   },
 *   kind: 'primitive'
 * };
 * validateTypedField(invalid); // Throws ZodError with path information
 * ```
 */
export function validateTypedField(field: unknown): boolean {
  TypedFieldSchema.parse(field);
  return true;
}
