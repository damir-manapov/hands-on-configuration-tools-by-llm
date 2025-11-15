import { describe, it, expect } from 'vitest';
import { extractTypedFieldValue } from './extract-typed-field-value.js';
import type { TypedField } from '../../types.js';

describe('extractTypedFieldValue', () => {
  it('should extract value from primitive TypedField', () => {
    const field: TypedField = {
      value: 'test',
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toBe('test');
  });

  it('should extract value from TypedField with number', () => {
    const field: TypedField = {
      value: 42,
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toBe(42);
  });

  it('should extract value from TypedField with boolean', () => {
    const field: TypedField = {
      value: true,
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toBe(true);
  });

  it('should extract nested TypedField values recursively', () => {
    const field: TypedField = {
      value: {
        name: { value: 'John', kind: 'primitive' },
        age: { value: 30, kind: 'primitive' },
      },
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toEqual({
      name: 'John',
      age: 30,
    });
  });

  it('should extract deeply nested TypedField values', () => {
    const field: TypedField = {
      value: {
        user: {
          value: {
            name: { value: 'John', kind: 'primitive' },
            profile: {
              value: {
                bio: { value: 'Developer', kind: 'primitive' },
              },
              kind: 'primitive',
            },
          },
          kind: 'primitive',
        },
      },
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toEqual({
      user: {
        name: 'John',
        profile: {
          bio: 'Developer',
        },
      },
    });
  });

  it('should handle TypedField with link kind', () => {
    const field: TypedField = {
      value: 'user-id-123',
      kind: 'link',
      entity: 'user',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toBe('user-id-123');
  });

  it('should handle TypedField with array of primitives', () => {
    const field: TypedField = {
      value: [1, 2, 3],
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toEqual([1, 2, 3]);
  });

  it('should handle TypedField with array of TypedField objects', () => {
    const field: TypedField = {
      value: [
        { value: 'tag1', kind: 'primitive' },
        { value: 'tag2', kind: 'primitive' },
        { value: 'tag3', kind: 'primitive' },
      ],
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should handle TypedField with array of TypedField objects containing objects', () => {
    const field: TypedField = {
      value: [
        {
          value: {
            name: { value: 'John', kind: 'primitive' },
            age: { value: 30, kind: 'primitive' },
          },
          kind: 'primitive',
        },
        {
          value: {
            name: { value: 'Jane', kind: 'primitive' },
            age: { value: 25, kind: 'primitive' },
          },
          kind: 'primitive',
        },
      ],
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toEqual([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ]);
  });

  it('should handle TypedField with plain object value (not TypedField)', () => {
    const field: TypedField = {
      value: { name: 'John', age: 30 },
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    // Plain object should be returned as-is
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  it('should handle mixed nested structure', () => {
    const field: TypedField = {
      value: {
        name: { value: 'John', kind: 'primitive' },
        metadata: { role: 'admin', active: true }, // Plain object, not TypedField
        tags: { value: ['tag1', 'tag2'], kind: 'primitive' },
      },
      kind: 'primitive',
    };

    const result = extractTypedFieldValue(field);

    expect(result).toEqual({
      name: 'John',
      metadata: { role: 'admin', active: true },
      tags: ['tag1', 'tag2'],
    });
  });

  it('should handle empty TypedField object', () => {
    const field: TypedField = {
      value: {},
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toEqual({});
  });

  it('should handle TypedField with null value', () => {
    const field: TypedField = {
      value: null,
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toBe(null);
  });

  it('should handle TypedField with undefined value', () => {
    const field: TypedField = {
      value: undefined,
      kind: 'primitive',
    };
    const result = extractTypedFieldValue(field);

    expect(result).toBe(undefined);
  });
});
