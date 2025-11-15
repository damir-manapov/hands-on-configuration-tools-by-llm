import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateTypedField } from './validate-typed-field.js';
import type { TypedField } from '../../types.js';

describe('validateTypedField', () => {
  it('should validate a primitive TypedField', () => {
    const field: TypedField = {
      value: 'test',
      kind: 'primitive',
    };
    expect(() => validateTypedField(field)).not.toThrow();
  });

  it('should validate a link TypedField', () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    expect(() => validateTypedField(field)).not.toThrow();
  });

  it('should validate nested TypedField objects', () => {
    const field: TypedField = {
      value: {
        name: { value: 'John', kind: 'primitive' },
        age: { value: 30, kind: 'primitive' },
      },
      kind: 'primitive',
    };
    expect(() => validateTypedField(field)).not.toThrow();
  });

  it('should validate deeply nested TypedField objects', () => {
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
    expect(() => validateTypedField(field)).not.toThrow();
  });

  it('should validate TypedField with arrays of primitives', () => {
    const field: TypedField = {
      value: [
        { value: 'tag1', kind: 'primitive' },
        { value: 'tag2', kind: 'primitive' },
      ],
      kind: 'primitive',
    };
    expect(() => validateTypedField(field)).not.toThrow();
  });

  it('should validate TypedField with arrays of TypedField objects', () => {
    const field: TypedField = {
      value: [
        {
          value: { name: { value: 'John', kind: 'primitive' } },
          kind: 'primitive',
        },
        {
          value: { name: { value: 'Jane', kind: 'primitive' } },
          kind: 'primitive',
        },
      ],
      kind: 'primitive',
    };
    expect(() => validateTypedField(field)).not.toThrow();
  });

  it('should throw error for invalid TypedField structure', () => {
    const invalid = {
      value: 'test',
      // Missing 'kind' property
    };
    expect(() => validateTypedField(invalid)).toThrow(z.ZodError);
  });

  it('should throw error for invalid kind', () => {
    const invalid = {
      value: 'test',
      kind: 'invalid',
    };
    expect(() => validateTypedField(invalid)).toThrow(z.ZodError);
  });

  it('should throw error for link field without entity', () => {
    const invalid = {
      value: '123',
      kind: 'link',
      // Missing 'entity' property
    };
    expect(() => validateTypedField(invalid)).toThrow(z.ZodError);
  });

  it('should throw error for nested object that is not a TypedField', () => {
    const invalid: TypedField = {
      value: {
        name: { value: 'John', kind: 'primitive' },
        profile: { name: 'John' }, // Not a TypedField
      },
      kind: 'primitive',
    };
    expect(() => validateTypedField(invalid)).toThrow(z.ZodError);
  });

  it('should throw error for nested primitive that is not a TypedField', () => {
    const invalid: TypedField = {
      value: {
        name: { value: 'John', kind: 'primitive' },
        age: 30, // Not a TypedField
      },
      kind: 'primitive',
    };
    expect(() => validateTypedField(invalid)).toThrow(z.ZodError);
  });

  it('should throw error for invalid nested TypedField', () => {
    const invalid: TypedField = {
      value: {
        user: {
          value: {
            name: { value: 'John', kind: 'primitive' },
            profile: { name: 'John' }, // Not a TypedField
          },
          kind: 'primitive',
        },
      },
      kind: 'primitive',
    };
    expect(() => validateTypedField(invalid)).toThrow(z.ZodError);
  });

  it('should throw error for array element that is not a TypedField', () => {
    const invalid: TypedField = {
      value: [
        { value: 'tag1', kind: 'primitive' },
        'tag2', // Not a TypedField
      ],
      kind: 'primitive',
    };
    expect(() => validateTypedField(invalid)).toThrow(z.ZodError);
  });

  it('should validate null and undefined values', () => {
    const field1: TypedField = {
      value: null,
      kind: 'primitive',
    };
    expect(() => validateTypedField(field1)).not.toThrow();

    const field2: TypedField = {
      value: undefined,
      kind: 'primitive',
    };
    expect(() => validateTypedField(field2)).not.toThrow();
  });
});
