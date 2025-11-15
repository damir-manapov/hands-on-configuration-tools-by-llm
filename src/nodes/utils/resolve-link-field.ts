import { z } from 'zod';
import type { FieldResolver, TypedField } from '../../types.js';
import {
  CannotTraverseError,
  NullFieldError,
  ResolverFailedError,
  UnexpectedObjectValueError,
} from '../../errors/index.js';
import { validateTypedField } from './validate-typed-field.js';

/**
 * Resolves a link field value using the resolver to fetch the object from external storage.
 *
 * This function is used when traversing a path and encountering a non-object value
 * that needs to be resolved to continue traversal. The field must be a link field,
 * and the resolver is called to fetch the object from external storage.
 *
 * @param field - The TypedField containing the value and type information
 * @param resolver - Function to resolve values from external storage
 * @returns The resolved value as Record<string, TypedField> if resolution was successful
 * @throws {NullFieldError} When the value is null or undefined (cannot be resolved)
 * @throws {UnexpectedObjectValueError} When the value is already an object (this function should not be called in this case)
 * @throws {CannotTraverseError} When the field is not a link field and cannot be resolved
 * @throws {ResolverFailedError} When the resolver returns an invalid value
 *
 * @example
 * ```ts
 * // Resolving a link field with a primitive value
 * const field: TypedField = {
 *   value: '123',
 *   kind: 'link',
 *   entity: 'user'
 * };
 * const resolver = async (value, entityName) => {
 *   if (entityName === 'user') {
 *     return {
 *       id: { value: '123', kind: 'primitive' },
 *       name: { value: 'John', kind: 'primitive' }
 *     };
 *   }
 *   return value;
 * };
 * const resolved = await resolveLinkField(field, resolver);
 * // Returns: { id: { value: '123', kind: 'primitive' }, name: { value: 'John', kind: 'primitive' } }
 *
 * ```
 */
export async function resolveLinkField(
  field: TypedField,
  resolver: FieldResolver,
): Promise<Record<string, TypedField>> {
  const value = field.value;

  // If value is null/undefined, we can't resolve it
  if (value === null || value === undefined) {
    throw new NullFieldError('', '', '');
  }

  // If it's already an object, resolution shouldn't be needed
  if (typeof value === 'object') {
    throw new UnexpectedObjectValueError('', '', '');
  }

  // Check if we can traverse - must be a link field that can be resolved
  if (field.kind !== 'link') {
    throw new CannotTraverseError('', '', '');
  }

  const resolved = await resolver(value, field.entity);

  // Check for error conditions first
  if (
    resolved === null ||
    resolved === undefined ||
    typeof resolved !== 'object'
  ) {
    throw new ResolverFailedError(
      '',
      '',
      field.entity,
      'Resolver returned non-object value',
    );
  }

  // Arrays are objects but cannot be traversed with dot notation
  if (Array.isArray(resolved)) {
    throw new ResolverFailedError(
      '',
      '',
      field.entity,
      'Resolver returned an array, but an object is required for field traversal',
    );
  }

  // Validate that all values in the resolved object are TypedField objects recursively
  // This ensures type safety when the result is used for further traversal
  const resolvedRecord = resolved as Record<string, unknown>;
  for (const key in resolvedRecord) {
    const value = resolvedRecord[key];
    try {
      validateTypedField(value);
    } catch (error) {
      let errorMessage = 'Invalid TypedField structure';
      if (error instanceof z.ZodError) {
        const issues = error.issues
          .map((issue) => {
            // Construct full path: top-level key + nested path from Zod
            const nestedPath =
              issue.path.length > 0 ? issue.path.join('.') : '';
            const fullPath =
              nestedPath.length > 0 ? `${key}.${nestedPath}` : key;
            return `${fullPath}: ${issue.message}`;
          })
          .join('; ');
        errorMessage = issues;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new ResolverFailedError(
        '',
        '',
        field.entity,
        `Resolver returned an object with invalid field: ${errorMessage}`,
      );
    }
  }

  return resolved;
}
