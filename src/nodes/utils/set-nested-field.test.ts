import { describe, it, expect } from 'vitest';
import { setNestedField } from './set-nested-field.js';
import type { TypedField } from '../../types.js';
import { CannotTraverseError } from '../../errors/index.js';

describe('setNestedField', () => {
  it('should set a value at a top-level path', () => {
    const obj: Record<string, TypedField> = {};
    const value: TypedField = { value: 'test', kind: 'primitive' };

    setNestedField(obj, 'field1', value);

    expect(obj['field1']).toEqual(value);
  });

  it('should set a value at a nested path', () => {
    const obj: Record<string, TypedField> = {};
    const value: TypedField = { value: 'John', kind: 'primitive' };

    setNestedField(obj, 'user.name', value);

    expect(obj).toEqual({
      user: {
        value: {
          name: value,
        },
        kind: 'primitive',
      },
    });
  });

  it('should set a value at a deeply nested path', () => {
    const obj: Record<string, TypedField> = {};
    const value: TypedField = { value: 'New York', kind: 'primitive' };

    setNestedField(obj, 'address.location.city', value);

    expect(obj).toEqual({
      address: {
        value: {
          location: {
            value: {
              city: value,
            },
            kind: 'primitive',
          },
        },
        kind: 'primitive',
      },
    });
  });

  it('should create intermediate objects if they do not exist', () => {
    const obj: Record<string, TypedField> = {
      existing: { value: 'data', kind: 'primitive' },
    };
    const value: TypedField = { value: 'test', kind: 'primitive' };

    setNestedField(obj, 'new.nested.field', value);

    expect(obj).toEqual({
      existing: { value: 'data', kind: 'primitive' },
      new: {
        value: {
          nested: {
            value: {
              field: value,
            },
            kind: 'primitive',
          },
        },
        kind: 'primitive',
      },
    });
  });

  it('should overwrite existing nested field', () => {
    const obj: Record<string, TypedField> = {
      user: {
        value: {
          name: { value: 'Old Name', kind: 'primitive' },
          age: { value: 30, kind: 'primitive' },
        },
        kind: 'primitive',
      },
    };
    const newValue: TypedField = { value: 'New Name', kind: 'primitive' };

    setNestedField(obj, 'user.name', newValue);

    expect(obj).toEqual({
      user: {
        value: {
          name: newValue,
          age: { value: 30, kind: 'primitive' },
        },
        kind: 'primitive',
      },
    });
  });

  it('should throw error when trying to set field on non-object value', () => {
    const obj: Record<string, TypedField> = {
      user: { value: 'not-an-object', kind: 'primitive' },
    };
    const value: TypedField = { value: 'John', kind: 'primitive' };

    expect(() => {
      setNestedField(obj, 'user.name', value);
    }).toThrow(CannotTraverseError);
  });

  it('should create new object when field value is null', () => {
    const obj: Record<string, TypedField> = {
      user: { value: null, kind: 'primitive' },
    };
    const value: TypedField = { value: 'John', kind: 'primitive' };

    setNestedField(obj, 'user.name', value);

    expect(obj).toEqual({
      user: {
        value: {
          name: value,
        },
        kind: 'primitive',
      },
    });
  });

  it('should create new object when field value is undefined', () => {
    const obj: Record<string, TypedField> = {
      user: { value: undefined, kind: 'primitive' },
    };
    const value: TypedField = { value: 'John', kind: 'primitive' };

    setNestedField(obj, 'user.name', value);

    expect(obj).toEqual({
      user: {
        value: {
          name: value,
        },
        kind: 'primitive',
      },
    });
  });

  it('should throw error when trying to set field on array value', () => {
    const obj: Record<string, TypedField> = {
      user: { value: [1, 2, 3], kind: 'primitive' },
    };
    const value: TypedField = { value: 'John', kind: 'primitive' };

    expect(() => {
      setNestedField(obj, 'user.name', value);
    }).toThrow(CannotTraverseError);
  });

  it('should throw error when trying to set deeply nested field through array', () => {
    const obj: Record<string, TypedField> = {
      data: {
        value: {
          items: { value: [1, 2, 3], kind: 'primitive' },
        },
        kind: 'primitive',
      },
    };
    const value: TypedField = { value: 'test', kind: 'primitive' };

    expect(() => {
      setNestedField(obj, 'data.items.field', value);
    }).toThrow(CannotTraverseError);
  });

  it('should set multiple nested fields independently', () => {
    const obj: Record<string, TypedField> = {};
    const value1: TypedField = { value: 'John', kind: 'primitive' };
    const value2: TypedField = { value: 'Doe', kind: 'primitive' };

    setNestedField(obj, 'user.firstName', value1);
    setNestedField(obj, 'user.lastName', value2);

    expect(obj).toEqual({
      user: {
        value: {
          firstName: value1,
          lastName: value2,
        },
        kind: 'primitive',
      },
    });
  });

  it('should handle empty path (single dot)', () => {
    const obj: Record<string, TypedField> = {};
    const value: TypedField = { value: 'test', kind: 'primitive' };

    // Empty path should set at root level with empty key
    setNestedField(obj, '', value);

    // Empty string path should be treated as a single part
    expect(obj['']).toEqual(value);
  });

  it('should handle path with only one part', () => {
    const obj: Record<string, TypedField> = {};
    const value: TypedField = { value: 'test', kind: 'primitive' };

    setNestedField(obj, 'field', value);

    expect(obj['field']).toEqual(value);
  });
});
