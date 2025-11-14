/**
 * Gets a nested field value from an object using dot notation.
 *
 * @param obj - The object to traverse
 * @param path - Dot-separated path to the field (e.g., "user.name" or "address.city")
 * @returns The value at the path, or undefined if the path doesn't exist or any part is null/undefined
 *
 * @example
 * ```ts
 * const obj = { user: { name: 'John', age: 30 } };
 * getNestedFieldValue(obj, 'user.name'); // 'John'
 * getNestedFieldValue(obj, 'user.email'); // undefined
 * getNestedFieldValue(obj, 'user.address.city'); // undefined
 * ```
 */
export function getNestedFieldValue(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
