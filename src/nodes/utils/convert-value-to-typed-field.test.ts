import { describe, it, expect } from 'vitest';
import { convertValueToTypedField } from './convert-value-to-typed-field.js';

describe('convertValueToTypedField', () => {
  it('should convert primitive string to TypedField', () => {
    const result = convertValueToTypedField('hello');

    expect(result).toEqual({
      value: 'hello',
      kind: 'primitive',
    });
  });

  it('should convert primitive number to TypedField', () => {
    const result = convertValueToTypedField(42);

    expect(result).toEqual({
      value: 42,
      kind: 'primitive',
    });
  });

  it('should convert primitive boolean to TypedField', () => {
    expect(convertValueToTypedField(true)).toEqual({
      value: true,
      kind: 'primitive',
    });
    expect(convertValueToTypedField(false)).toEqual({
      value: false,
      kind: 'primitive',
    });
  });

  it('should handle null and undefined', () => {
    expect(convertValueToTypedField(null)).toEqual({
      value: null,
      kind: 'primitive',
    });
    expect(convertValueToTypedField(undefined)).toEqual({
      value: undefined,
      kind: 'primitive',
    });
  });

  it('should convert array of primitives to TypedField', () => {
    const result = convertValueToTypedField(['tag1', 'tag2']);

    expect(result).toEqual({
      value: [
        { value: 'tag1', kind: 'primitive' },
        { value: 'tag2', kind: 'primitive' },
      ],
      kind: 'primitive',
    });
  });

  it('should convert array of numbers to TypedField', () => {
    const result = convertValueToTypedField([1, 2, 3]);

    expect(result).toEqual({
      value: [
        { value: 1, kind: 'primitive' },
        { value: 2, kind: 'primitive' },
        { value: 3, kind: 'primitive' },
      ],
      kind: 'primitive',
    });
  });

  it('should recursively convert array of objects', () => {
    const result = convertValueToTypedField([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ]);

    expect(result).toEqual({
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

  it('should recursively convert nested arrays', () => {
    const result = convertValueToTypedField([
      [1, 2],
      [3, 4],
    ]);

    expect(result).toEqual({
      value: [
        {
          value: [
            { value: 1, kind: 'primitive' },
            { value: 2, kind: 'primitive' },
          ],
          kind: 'primitive',
        },
        {
          value: [
            { value: 3, kind: 'primitive' },
            { value: 4, kind: 'primitive' },
          ],
          kind: 'primitive',
        },
      ],
      kind: 'primitive',
    });
  });

  it('should convert object to TypedField (delegates to convertRecordToTypedField)', () => {
    const result = convertValueToTypedField({ name: 'John', age: 30 });

    expect(result).toEqual({
      value: {
        name: { value: 'John', kind: 'primitive' },
        age: { value: 30, kind: 'primitive' },
      },
      kind: 'primitive',
    });
  });

  it('should convert nested object to TypedField', () => {
    const result = convertValueToTypedField({
      user: { name: 'John', age: 30 },
    });

    expect(result).toEqual({
      value: {
        user: {
          value: {
            name: { value: 'John', kind: 'primitive' },
            age: { value: 30, kind: 'primitive' },
          },
          kind: 'primitive',
        },
      },
      kind: 'primitive',
    });
  });

  it('should handle mixed array with primitives and objects', () => {
    const result = convertValueToTypedField([
      'string',
      42,
      { name: 'John' },
      true,
    ]);

    expect(result).toEqual({
      value: [
        { value: 'string', kind: 'primitive' },
        { value: 42, kind: 'primitive' },
        {
          value: {
            name: { value: 'John', kind: 'primitive' },
          },
          kind: 'primitive',
        },
        { value: true, kind: 'primitive' },
      ],
      kind: 'primitive',
    });
  });
});
