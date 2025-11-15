import type { FieldResolver, TypedField } from '../../types.js';
import {
  CannotTraverseError,
  FieldNotFoundError,
  NullFieldError,
  ResolverFailedError,
  ResolverRequiredError,
  UnexpectedObjectValueError,
} from '../../errors/index.js';
import { resolveLinkField } from './resolve-link-field.js';

/**
 * Gets a nested field value from an object using dot notation, with support for
 * resolving values from external storage via a resolver function.
 *
 * When traversing the path, if a non-object value is encountered but further
 * traversal is needed, the resolver function is called to potentially resolve
 * the value from external storage (e.g., database, cache, API).
 *
 * All fields must be stored as TypedField objects with type information:
 * `{ userId: { value: '123', kind: 'link', entity: 'user' } }`
 *
 * When a field has `kind: 'link'`, the resolver is called
 * with the entity name to resolve the value from external storage.
 *
 * @param obj - The TypedField containing the object to traverse (value must be Record<string, TypedField>)
 * @param path - Dot-separated path to the field (e.g., "user.profile.name")
 * @param resolver - Optional function to resolve values from external storage
 * @returns The TypedField at the path
 * @throws {FieldNotFoundError} When a field in the path doesn't exist
 * @throws {NullFieldError} When a field in the path is null or undefined
 * @throws {ResolverRequiredError} When a resolver is required but not provided
 * @throws {ResolverFailedError} When a resolver returns an invalid value
 * @throws {CannotTraverseError} When a primitive value cannot be traversed
 *
 * @example
 * ```ts
 * // With typed fields and resolver
 * const resolver = async (value, entityName) => {
 *   if (entityName === 'user' && typeof value === 'string') {
 *     return await userRepository.findById(value);
 *     // Returns: { email: { value: 'john@example.com', kind: 'primitive' }, ... }
 *   }
 *   return value;
 * };
 * const obj: TypedField = {
 *   value: {
 *     userId: {
 *       value: '123',
 *       kind: 'link',
 *       entity: 'user'
 *     },
 *     orderId: {
 *       value: '456',
 *       kind: 'primitive'
 *     }
 *   },
 *   kind: 'primitive'
 * };
 * const emailField = await getNestedFieldValue(obj, 'userId.email', resolver);
 * // Returns: { value: 'john@example.com', kind: 'primitive' }
 * // Access the value: emailField.value
 * ```
 */

export async function getNestedFieldValue(
  obj: TypedField,
  path: string,
  resolver?: FieldResolver,
): Promise<TypedField> {
  // Extract the Record<string, TypedField> from the TypedField value
  if (obj.value === null || obj.value === undefined) {
    throw new NullFieldError(path, '', '');
  }
  if (typeof obj.value !== 'object' || Array.isArray(obj.value)) {
    throw new CannotTraverseError(path, '', '');
  }

  const parts = path.split('.');
  let currentObject: unknown = obj.value as Record<string, TypedField>;
  const traversedPath: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    const currentPath = traversedPath.join('.');

    // If currentObject is null/undefined, we can't continue
    if (currentObject === null || currentObject === undefined) {
      throw new NullFieldError(path, part, currentPath);
    }

    // CurrentObject must be an object to access fields
    if (typeof currentObject !== 'object') {
      throw new CannotTraverseError(path, part, currentPath);
    }

    // Get the field from the current object
    const field = (currentObject as Record<string, TypedField>)[part];
    if (field === undefined) {
      throw new FieldNotFoundError(path, part, currentPath);
    }

    // If this is the last part, return the TypedField immediately
    const isLastPart = i === parts.length - 1;
    if (isLastPart) {
      return field;
    }

    // Extract the value from the field
    const value = field.value;

    // If value is null/undefined, we can't continue
    if (value === null || value === undefined) {
      throw new NullFieldError(path, part, currentPath);
    }

    // If value is already an object, use it directly
    if (typeof value === 'object') {
      currentObject = value;
    } else {
      // Need to resolve to get an object for further traversal
      // Check error conditions first
      if (field.kind !== 'link') {
        throw new CannotTraverseError(path, part, currentPath);
      }
      if (!resolver) {
        throw new ResolverRequiredError(path, part, field.entity);
      }
      // All checks passed, resolve the link field
      // Wrap errors with path information for better error messages
      try {
        currentObject = await resolveLinkField(field, resolver);
      } catch (error) {
        // Re-throw errors with proper path information
        if (error instanceof NullFieldError) {
          throw new NullFieldError(path, part, currentPath);
        }
        if (error instanceof UnexpectedObjectValueError) {
          throw new UnexpectedObjectValueError(path, part, currentPath);
        }
        if (error instanceof CannotTraverseError) {
          throw new CannotTraverseError(path, part, currentPath);
        }
        if (error instanceof ResolverFailedError) {
          throw new ResolverFailedError(path, part, field.entity, error.reason);
        }
        // Re-throw unknown errors as-is
        throw error;
      }
    }

    traversedPath.push(part);
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected end of path traversal');
}
