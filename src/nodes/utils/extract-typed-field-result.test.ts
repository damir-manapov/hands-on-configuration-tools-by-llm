import { describe, it, expect } from 'vitest';
import { extractTypedFieldResult } from './extract-typed-field-result.js';
import type { TypedField } from '../../types.js';

describe('extractTypedFieldResult', () => {
  it('should extract values from TypedField[][]', () => {
    const result: TypedField[][] = [
      [
        {
          value: {
            name: { value: 'John', kind: 'primitive' },
            age: { value: 30, kind: 'primitive' },
          },
          kind: 'primitive',
        },
      ],
    ];

    const extracted = extractTypedFieldResult(result);

    expect(extracted).toEqual([[{ name: 'John', age: 30 }]]);
  });

  it('should handle multiple items in outer array', () => {
    const result: TypedField[][] = [
      [
        {
          value: { item1: { value: 'data1', kind: 'primitive' } },
          kind: 'primitive',
        },
      ],
      [
        {
          value: { item2: { value: 'data2', kind: 'primitive' } },
          kind: 'primitive',
        },
      ],
    ];

    const extracted = extractTypedFieldResult(result);

    expect(extracted).toEqual([[{ item1: 'data1' }], [{ item2: 'data2' }]]);
  });

  it('should handle multiple items in inner array', () => {
    const result: TypedField[][] = [
      [
        {
          value: { item1: { value: 'data1', kind: 'primitive' } },
          kind: 'primitive',
        },
        {
          value: { item2: { value: 'data2', kind: 'primitive' } },
          kind: 'primitive',
        },
        {
          value: { item3: { value: 'data3', kind: 'primitive' } },
          kind: 'primitive',
        },
      ],
    ];

    const extracted = extractTypedFieldResult(result);

    expect(extracted).toEqual([
      [{ item1: 'data1' }, { item2: 'data2' }, { item3: 'data3' }],
    ]);
  });

  it('should handle empty arrays', () => {
    const result: TypedField[][] = [];

    const extracted = extractTypedFieldResult(result);

    expect(extracted).toEqual([]);
  });

  it('should handle empty inner arrays', () => {
    const result: TypedField[][] = [[]];

    const extracted = extractTypedFieldResult(result);

    expect(extracted).toEqual([[]]);
  });

  it('should handle nested TypedField structures', () => {
    const result: TypedField[][] = [
      [
        {
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
        },
      ],
    ];

    const extracted = extractTypedFieldResult(result);

    expect(extracted).toEqual([
      [
        {
          user: {
            name: 'John',
            profile: {
              bio: 'Developer',
            },
          },
        },
      ],
    ]);
  });
});
