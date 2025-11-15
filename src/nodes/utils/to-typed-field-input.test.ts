import { describe, it, expect } from 'vitest';
import { toTypedFieldInput } from './to-typed-field-input.js';

describe('toTypedFieldInput', () => {
  it('should convert array of arrays to TypedField[][]', () => {
    const input = [[{ name: 'John' }], [{ name: 'Jane' }]];
    const result = toTypedFieldInput(input);

    expect(result).toEqual([
      [
        {
          value: {
            name: { value: 'John', kind: 'primitive' },
          },
          kind: 'primitive',
        },
      ],
      [
        {
          value: {
            name: { value: 'Jane', kind: 'primitive' },
          },
          kind: 'primitive',
        },
      ],
    ]);
  });

  it('should handle empty input array', () => {
    const input: Record<string, unknown>[][] = [];
    const result = toTypedFieldInput(input);

    expect(result).toEqual([]);
  });

  it('should handle array with empty inner arrays', () => {
    const input = [[], []];
    const result = toTypedFieldInput(input);

    expect(result).toEqual([[], []]);
  });

  it('should handle multiple items in inner arrays', () => {
    const input = [
      [{ name: 'John', age: 30 }],
      [
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 },
      ],
    ];
    const result = toTypedFieldInput(input);

    expect(result).toEqual([
      [
        {
          value: {
            name: { value: 'John', kind: 'primitive' },
            age: { value: 30, kind: 'primitive' },
          },
          kind: 'primitive',
        },
      ],
      [
        {
          value: {
            name: { value: 'Jane', kind: 'primitive' },
            age: { value: 25, kind: 'primitive' },
          },
          kind: 'primitive',
        },
        {
          value: {
            name: { value: 'Bob', kind: 'primitive' },
            age: { value: 35, kind: 'primitive' },
          },
          kind: 'primitive',
        },
      ],
    ]);
  });

  it('should handle objects with various primitive types', () => {
    const input = [
      [
        {
          string: 'text',
          number: 42,
          boolean: true,
          nullValue: null,
        },
      ],
    ];
    const result = toTypedFieldInput(input);

    expect(result).toEqual([
      [
        {
          value: {
            string: { value: 'text', kind: 'primitive' },
            number: { value: 42, kind: 'primitive' },
            boolean: { value: true, kind: 'primitive' },
            nullValue: { value: null, kind: 'primitive' },
          },
          kind: 'primitive',
        },
      ],
    ]);
  });

  it('should return TypedField[][] with correct structure', () => {
    const input = [[{ test: 'value' }]];
    const result = toTypedFieldInput(input);

    expect(result).toEqual([
      [
        {
          value: {
            test: { value: 'value', kind: 'primitive' },
          },
          kind: 'primitive',
        },
      ],
    ]);
  });

  it('should handle nested objects in input', () => {
    const input = [
      [
        {
          user: { name: 'John', age: 30 },
          metadata: { role: 'admin' },
        },
      ],
    ];
    const result = toTypedFieldInput(input);

    expect(result).toEqual([
      [
        {
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
        },
      ],
    ]);
  });
});
