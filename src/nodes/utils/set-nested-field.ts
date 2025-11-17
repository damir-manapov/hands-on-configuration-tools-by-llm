import type { TypedField } from '../../types.js';
import { CannotTraverseError } from '../../errors/index.js';

/**
 * Sets a value at a nested path in a Record<string, TypedField> structure.
 * Creates intermediate objects if they don't exist.
 *
 * @param obj - The object to set the value in (will be mutated)
 * @param path - Dot-separated path to the field (e.g., "status", "user.name", "address.location.city")
 * @param value - The TypedField value to set at the path
 * @throws {CannotTraverseError} When trying to set a field on an array value
 *
 * @example
 * ```ts
 * const obj: Record<string, TypedField> = {
 *   existing: { value: 'data', kind: 'primitive' }
 * };
 * setNestedField(obj, 'user.name', { value: 'John', kind: 'primitive' });
 * // Result: { existing: { value: 'data', kind: 'primitive' }, user: { value: { name: { value: 'John', kind: 'primitive' } }, kind: 'primitive' } }
 * ```
 */
export function setNestedField(
  obj: Record<string, TypedField>,
  path: string,
  value: TypedField,
): void {
  const parts = path.split('.');
  let current: Record<string, TypedField> = obj;
  const traversedPath: string[] = [];

  // Navigate to the parent of the target field
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const currentPath = traversedPath.join('.');
    const field = current[part];
    
    // Fail fast: check for array first before any other operations
    if (field && Array.isArray(field.value)) {
      throw new CannotTraverseError(path, part, currentPath);
    }
    
    if (!field || field.value === null || field.value === undefined) {
      // Create a new object if it doesn't exist
      const newField: TypedField = {
        value: {},
        kind: 'primitive',
      };
      current[part] = newField;
      current = newField.value as Record<string, TypedField>;
    } else if (typeof field.value !== 'object') {
      // Fail fast: throw error for non-object values (primitives)
      throw new CannotTraverseError(path, part, currentPath);
    } else {
      current = field.value as Record<string, TypedField>;
    }
    traversedPath.push(part);
  }

  // Set the value at the final path
  const finalPart = parts[parts.length - 1]!;
  current[finalPart] = value;
}

