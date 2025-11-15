import { describe, it, expect } from 'vitest';
import { convertRecordToTypedField } from './convert-record-to-typed-field.js';
import type { TypedField } from '../../types.js';

describe('convertRecordToTypedField', () => {
  it('should convert plain object to TypedField format', () => {
    const data = { name: 'John', age: 30 };
    const result = convertRecordToTypedField(data);

    expect(result).toEqual({
      value: {
        name: { value: 'John', kind: 'primitive' },
        age: { value: 30, kind: 'primitive' },
      },
      kind: 'primitive',
    });
  });

  it('should handle empty object', () => {
    const data = {};
    const result = convertRecordToTypedField(data);

    expect(result).toEqual({
      value: {},
      kind: 'primitive',
    });
  });

  it('should handle object with various primitive types', () => {
    const data = {
      string: 'text',
      number: 42,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
    };
    const result = convertRecordToTypedField(data);

    expect(result).toEqual({
      value: {
        string: { value: 'text', kind: 'primitive' },
        number: { value: 42, kind: 'primitive' },
        boolean: { value: true, kind: 'primitive' },
        nullValue: { value: null, kind: 'primitive' },
        undefinedValue: { value: undefined, kind: 'primitive' },
      },
      kind: 'primitive',
    });
  });

  it('should recursively convert nested objects to TypedFields', () => {
    const data = {
      user: { name: 'John', age: 30 },
      metadata: { role: 'admin' },
    };
    const result = convertRecordToTypedField(data);

    expect(result).toEqual({
      value: {
        user: {
          value: {
            name: { value: 'John', kind: 'primitive' },
            age: { value: 30, kind: 'primitive' },
          },
          kind: 'primitive',
        },
        metadata: {
          value: {
            role: { value: 'admin', kind: 'primitive' },
          },
          kind: 'primitive',
        },
      },
      kind: 'primitive',
    });
  });

  it('should handle object with arrays of primitives', () => {
    const data = {
      tags: ['tag1', 'tag2'],
      numbers: [1, 2, 3],
    };
    const result = convertRecordToTypedField(data);
    const value = result.value as Record<string, TypedField>;

    expect(value['tags']).toEqual({
      value: [
        { value: 'tag1', kind: 'primitive' },
        { value: 'tag2', kind: 'primitive' },
      ],
      kind: 'primitive',
    });
    expect(value['numbers']).toEqual({
      value: [
        { value: 1, kind: 'primitive' },
        { value: 2, kind: 'primitive' },
        { value: 3, kind: 'primitive' },
      ],
      kind: 'primitive',
    });
  });

  it('should recursively convert arrays of objects', () => {
    const data = {
      users: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ],
    };
    const result = convertRecordToTypedField(data);
    const value = result.value as Record<string, TypedField>;

    expect(value['users']).toEqual({
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
    });
  });

  it('should preserve all keys from input object', () => {
    const data = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    };
    const result = convertRecordToTypedField(data);
    const value = result.value as Record<string, TypedField>;

    expect(Object.keys(value)).toEqual(['key1', 'key2', 'key3']);
  });
});
