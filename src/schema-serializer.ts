import { z } from 'zod';

export interface SerializableFieldType {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';
  required: boolean;
  description?: string;
  default?: unknown;
  values?: readonly string[];
  itemType?: SerializableFieldSchema;
  fields?: Record<string, SerializableFieldSchema>;
}

export type SerializableFieldSchema = SerializableFieldType;

export interface SerializableParameterSchema {
  type: 'object';
  fields: Record<string, SerializableFieldSchema>;
}

function serializeZodType(
  zodType: z.ZodType<unknown>,
): SerializableFieldSchema {
  const def = zodType.def;
  const description =
    'description' in zodType && typeof zodType.description === 'string'
      ? zodType.description
      : undefined;

  // Handle optional
  if (zodType instanceof z.ZodOptional) {
    const inner = serializeZodType(
      (def as unknown as { innerType: z.ZodType<unknown> }).innerType,
    );
    return { ...inner, required: false, description };
  }

  // Handle default
  if (zodType instanceof z.ZodDefault) {
    const defaultDef = def as unknown as {
      innerType: z.ZodType<unknown>;
      defaultValue: unknown;
    };
    const inner = serializeZodType(defaultDef.innerType);
    return {
      ...inner,
      required: false,
      default: defaultDef.defaultValue,
      description: description ?? inner.description,
    };
  }

  // Handle nullable
  if (zodType instanceof z.ZodNullable) {
    const inner = serializeZodType(
      (def as unknown as { innerType: z.ZodType<unknown> }).innerType,
    );
    return { ...inner, required: false, description: description ?? inner.description };
  }

  // Handle string
  if (zodType instanceof z.ZodString) {
    return { type: 'string', required: true, description };
  }

  // Handle number
  if (zodType instanceof z.ZodNumber) {
    return { type: 'number', required: true, description };
  }

  // Handle boolean
  if (zodType instanceof z.ZodBoolean) {
    return { type: 'boolean', required: true, description };
  }

  // Handle enum
  if (zodType instanceof z.ZodEnum) {
    const enumDef = def as unknown as { entries: Record<string, string> };
    const values = Object.values(enumDef.entries);
    return {
      type: 'enum',
      values,
      required: true,
      description,
    };
  }

  // Handle array
  if (zodType instanceof z.ZodArray) {
    const arrayDef = def as unknown as { element: z.ZodType<unknown> };
    const itemType = serializeZodType(arrayDef.element);
    return {
      type: 'array',
      itemType,
      required: true,
      description,
    };
  }

  // Handle object
  if (zodType instanceof z.ZodObject) {
    const objectDef = def as unknown as {
      shape: Record<string, z.ZodType<unknown>>;
    };
    const shape = objectDef.shape;
    const fields: Record<string, SerializableFieldSchema> = {};

    for (const [key, value] of Object.entries(shape)) {
      fields[key] = serializeZodType(value);
    }

    return {
      type: 'object',
      fields,
      required: true,
      description,
    };
  }

  // Fallback for unknown types
  return { type: 'string', required: true, description };
}

export function serializeParameterSchema(
  schema: z.ZodType<unknown>,
): SerializableParameterSchema {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Parameter schema must be a ZodObject');
  }

  const def = schema.def as unknown as {
    shape: Record<string, z.ZodType<unknown>>;
  };
  const shape = def.shape;
  const fields: Record<string, SerializableFieldSchema> = {};

  for (const [key, value] of Object.entries(shape)) {
    fields[key] = serializeZodType(value);
  }

  return {
    type: 'object',
    fields,
  };
}
