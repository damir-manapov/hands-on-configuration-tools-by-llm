export interface NodeConfig {
  id: string;
  name: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  parameters: Record<string, unknown>;
}

export interface Connection {
  node: string;
  type: string;
  index: number;
}

export interface WorkflowNode extends NodeConfig {
  connections: Record<string, Connection[]>;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  active: boolean;
}

/**
 * Wrapped field value with type information for a link to an external entity.
 * Used when the field references an entity in external storage.
 */
export interface LinkTypedField {
  value: unknown;
  kind: 'link';
  entity: string; // Repository/entity name (e.g., 'user', 'product', 'order')
}

/**
 * Wrapped field value with type information for a primitive value.
 * Used for string, number, boolean, etc.
 */
export interface PrimitiveTypedField {
  value: unknown;
  kind: 'primitive';
}

/**
 * Wrapped field value with type information.
 * All fields must be stored in this format with type metadata.
 * Discriminated union: 'link' variant requires entity, 'primitive' variant has no entity.
 */
export type TypedField = LinkTypedField | PrimitiveTypedField;

/**
 * Resolver function type for resolving values from external storage.
 * Called when a non-object value is encountered but further traversal is needed.
 * Only called when a field has `kind: 'link'` with an entity name.
 *
 * **Requirements:**
 * - MUST return a `Record<string, TypedField>` where all values are valid TypedField objects
 * - All nested objects must also be TypedField structures (validated recursively)
 * - Cannot return null, undefined, primitives, or arrays (will throw ResolverFailedError)
 * - Can return a Promise for async resolution (e.g., database queries)
 *
 * @param value - The current value (might be an ID, reference, etc.)
 * @param entityName - The name of the entity/repository to use for resolution (always provided from field's entity)
 * @returns The resolved object as Record<string, TypedField> for further traversal.
 *          Must be a valid object with all nested values as TypedField structures.
 */
export type FieldResolver = (
  value: unknown,
  entityName: string,
) => Promise<Record<string, TypedField>> | Record<string, TypedField>;

export type ExecutionData = Record<string, TypedField[][]>;

export interface ExecutionResult {
  data: ExecutionData;
  finished: boolean;
  error?: Error;
}
