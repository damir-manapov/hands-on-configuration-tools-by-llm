import { z } from 'zod';
import { describe, it, expect } from 'vitest';
import {
  serializeParameterSchema,
  type SerializableParameterSchema,
} from '../src/schema-serializer.js';
import {
  noopNodePlugin,
  setNodePlugin,
  ifNodePlugin,
} from '../src/nodes/index.js';

describe('Schema Serializer', () => {
  it('should serialize empty object schema', () => {
    const schema = z.object({});
    const serialized = serializeParameterSchema(schema);

    expect(serialized).toEqual({
      type: 'object',
      fields: {},
    });

    // Verify it's JSON serializable
    expect(() => JSON.stringify(serialized)).not.toThrow();
  });

  it('should serialize string field', () => {
    const schema = z.object({
      name: z.string(),
    });
    const serialized = serializeParameterSchema(schema);

    expect(serialized.fields['name']).toEqual({
      type: 'string',
      required: true,
    });
  });

  it('should serialize optional string field', () => {
    const schema = z.object({
      name: z.string().optional(),
    });
    const serialized = serializeParameterSchema(schema);

    expect(serialized.fields['name']).toEqual({
      type: 'string',
      required: false,
    });
  });

  it('should serialize enum field', () => {
    const schema = z.object({
      operator: z.enum(['equals', 'notEquals', 'contains']),
    });
    const serialized = serializeParameterSchema(schema);

    expect(serialized.fields['operator']).toEqual({
      type: 'enum',
      values: ['equals', 'notEquals', 'contains'],
      required: true,
    });
  });

  it('should serialize array field', () => {
    const schema = z.object({
      values: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
        }),
      ),
    });
    const serialized = serializeParameterSchema(schema);

    expect(serialized.fields['values']).toEqual({
      type: 'array',
      itemType: {
        type: 'object',
        fields: {
          name: { type: 'string', required: true },
          value: { type: 'string', required: true },
        },
        required: true,
      },
      required: true,
    });
  });

  it('should serialize nested object field', () => {
    const schema = z.object({
      conditions: z.object({
        leftValue: z.string(),
        rightValue: z.string(),
        operator: z.enum(['equals', 'notEquals']),
      }),
    });
    const serialized = serializeParameterSchema(schema);

    expect(serialized.fields['conditions']).toEqual({
      type: 'object',
      fields: {
        leftValue: { type: 'string', required: true },
        rightValue: { type: 'string', required: true },
        operator: {
          type: 'enum',
          values: ['equals', 'notEquals'],
          required: true,
        },
      },
      required: true,
    });
  });

  it('should serialize noop node plugin schema', () => {
    const schema = noopNodePlugin.getParameterSchema();

    expect(schema).toEqual({
      type: 'object',
      fields: {},
    });

    // Verify JSON serializable
    expect(() => JSON.stringify(schema)).not.toThrow();
  });

  it('should serialize set node plugin schema', () => {
    const schema = setNodePlugin.getParameterSchema();

    expect(schema.type).toBe('object');
    expect(schema.fields['values']).toBeDefined();
    expect(schema.fields['values']?.type).toBe('array');

    // Verify JSON serializable
    expect(() => JSON.stringify(schema)).not.toThrow();
  });

  it('should serialize if node plugin schema', () => {
    const schema = ifNodePlugin.getParameterSchema();

    expect(schema.type).toBe('object');
    expect(schema.fields['condition']).toBeDefined();
    expect(schema.fields['condition']?.type).toBe('object');

    // Verify JSON serializable
    expect(() => JSON.stringify(schema)).not.toThrow();
  });

  it('should handle default values', () => {
    const schema = z.object({
      name: z.string().default('default-name'),
    });
    const serialized = serializeParameterSchema(schema);

    expect(serialized.fields['name']).toEqual({
      type: 'string',
      required: false,
      default: 'default-name',
    });
  });

  it('should extract descriptions from schema fields', () => {
    const schema = z.object({
      username: z.string().describe('The unique identifier for the user.'),
      age: z.number().describe('The age of the user in years.'),
      isActive: z
        .boolean()
        .describe('Indicates if the user account is active.'),
    });
    const serialized = serializeParameterSchema(schema);

    expect(serialized.fields['username']?.description).toBe(
      'The unique identifier for the user.',
    );
    expect(serialized.fields['age']?.description).toBe(
      'The age of the user in years.',
    );
    expect(serialized.fields['isActive']?.description).toBe(
      'Indicates if the user account is active.',
    );
  });

  it('should extract descriptions from nested objects and arrays', () => {
    const schema = z.object({
      items: z
        .array(
          z.object({
            name: z.string().describe('Item name'),
            value: z.number().describe('Item value'),
          }),
        )
        .describe('Array of items'),
    });
    const serialized = serializeParameterSchema(schema);

    expect(serialized.fields['items']?.description).toBe('Array of items');
    expect(
      serialized.fields['items']?.itemType?.fields?.['name']?.description,
    ).toBe('Item name');
    expect(
      serialized.fields['items']?.itemType?.fields?.['value']?.description,
    ).toBe('Item value');
  });

  it('should be fully JSON serializable for all node types', () => {
    const schemas = [
      noopNodePlugin.getParameterSchema(),
      setNodePlugin.getParameterSchema(),
      ifNodePlugin.getParameterSchema(),
    ];

    for (const schema of schemas) {
      const json = JSON.stringify(schema);
      expect(json).toBeTruthy();

      // Verify we can parse it back
      const parsed = JSON.parse(json) as SerializableParameterSchema;
      expect(parsed.type).toBe('object');
      expect(parsed.fields).toBeDefined();
    }
  });
});
