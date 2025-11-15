/**
 * Error thrown when a field cannot be found at the specified path.
 */
export class FieldNotFoundError extends Error {
  constructor(
    public readonly path: string,
    public readonly missingField: string,
    public readonly parentPath: string,
  ) {
    const fullPath = parentPath
      ? `${parentPath}.${missingField}`
      : missingField;
    super(
      `Field "${missingField}" not found at path "${path}". Missing field at: ${fullPath}`,
    );
    this.name = 'FieldNotFoundError';
  }
}

/**
 * Error thrown when a field value is null or undefined but further traversal is needed.
 */
export class NullFieldError extends Error {
  constructor(
    public readonly path: string,
    public readonly nullField: string,
    public readonly parentPath: string,
  ) {
    const fullPath = parentPath ? `${parentPath}.${nullField}` : nullField;
    super(
      `Field "${nullField}" is null or undefined at path "${path}". Cannot traverse further from: ${fullPath}`,
    );
    this.name = 'NullFieldError';
  }
}

/**
 * Error thrown when a resolver is required but not provided.
 * This occurs when a link field needs to be resolved but no resolver function was provided.
 */
export class ResolverRequiredError extends Error {
  constructor(
    public readonly path: string,
    public readonly field: string,
    public readonly entityName: string,
  ) {
    super(
      `Resolver is required for field "${field}" (entity: "${entityName}") at path "${path}" but was not provided`,
    );
    this.name = 'ResolverRequiredError';
  }
}

/**
 * Error thrown when a resolver function is called but returns an invalid value.
 * The resolver must return an object (Record<string, TypedField>) to allow further traversal.
 */
export class ResolverFailedError extends Error {
  constructor(
    public readonly path: string,
    public readonly field: string,
    public readonly entityName: string,
    public readonly reason: string,
  ) {
    super(
      `Resolver failed for field "${field}" (entity: "${entityName}") at path "${path}": ${reason}`,
    );
    this.name = 'ResolverFailedError';
  }
}

/**
 * Error thrown when resolveLinkField is called with a value that is already an object.
 * This function should only be called for non-object values that need to be resolved.
 * If the value is already an object, it should be used directly without calling this function.
 */
export class UnexpectedObjectValueError extends Error {
  constructor(
    public readonly path: string,
    public readonly field: string,
    public readonly parentPath: string,
  ) {
    const fullPath = parentPath ? `${parentPath}.${field}` : field;
    super(
      `Field "${fullPath}" already contains an object value at path "${path}". This function should only be called for non-object values that need resolution.`,
    );
    this.name = 'UnexpectedObjectValueError';
  }
}

/**
 * Error thrown when a primitive value is encountered but further traversal is needed.
 * This occurs when trying to access a nested field on a non-object value that cannot be resolved.
 */
export class CannotTraverseError extends Error {
  constructor(
    public readonly path: string,
    public readonly field: string,
    public readonly parentPath: string,
  ) {
    const fullPath = parentPath ? `${parentPath}.${field}` : field;
    super(
      `Cannot traverse field "${field}" at path "${path}". Field "${fullPath}" is not an object and cannot be traversed`,
    );
    this.name = 'CannotTraverseError';
  }
}

/**
 * Error thrown when a field value cannot be compared because it's not a comparable primitive type.
 * Condition evaluation requires string, number, or boolean values. Objects and arrays cannot be compared.
 */
export class IncomparableFieldValueError extends Error {
  constructor(
    public readonly path: string,
    public readonly field: string,
    public readonly valueType: string,
  ) {
    super(
      `Field "${field}" at path "${path}" has value of type "${valueType}" which cannot be compared. Only string, number, and boolean values can be used in conditions.`,
    );
    this.name = 'IncomparableFieldValueError';
  }
}
