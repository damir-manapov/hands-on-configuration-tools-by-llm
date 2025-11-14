import { describe, it, expect } from 'vitest';
import { getNestedFieldValue } from './get-nested-field-value.js';

describe('getNestedFieldValue', () => {
  it('should get top-level field value', () => {
    const obj = { name: 'John', age: 30 };
    expect(getNestedFieldValue(obj, 'name')).toBe('John');
    expect(getNestedFieldValue(obj, 'age')).toBe(30);
  });

  it('should get nested field value using dot notation', () => {
    const obj = { user: { name: 'John', age: 30 } };
    expect(getNestedFieldValue(obj, 'user.name')).toBe('John');
    expect(getNestedFieldValue(obj, 'user.age')).toBe(30);
  });

  it('should get deeply nested field value', () => {
    const obj = {
      user: {
        address: {
          location: { city: 'New York', country: 'USA' },
        },
      },
    };
    expect(getNestedFieldValue(obj, 'user.address.location.city')).toBe(
      'New York',
    );
    expect(getNestedFieldValue(obj, 'user.address.location.country')).toBe(
      'USA',
    );
  });

  it('should return undefined for missing top-level field', () => {
    const obj = { name: 'John' };
    expect(getNestedFieldValue(obj, 'email')).toBeUndefined();
  });

  it('should return undefined for missing nested field', () => {
    const obj = { user: { name: 'John' } };
    expect(getNestedFieldValue(obj, 'user.email')).toBeUndefined();
  });

  it('should return undefined for missing intermediate field', () => {
    const obj = { user: { name: 'John' } };
    expect(getNestedFieldValue(obj, 'user.address.city')).toBeUndefined();
  });

  it('should return undefined when path contains null', () => {
    const obj = { user: { profile: null } };
    expect(getNestedFieldValue(obj, 'user.profile.name')).toBeUndefined();
  });

  it('should return undefined when path contains undefined', () => {
    const obj = { user: { profile: undefined } };
    expect(getNestedFieldValue(obj, 'user.profile.name')).toBeUndefined();
  });

  it('should return undefined when intermediate object is null', () => {
    const obj = { user: null };
    expect(getNestedFieldValue(obj, 'user.name')).toBeUndefined();
  });

  it('should return undefined when intermediate object is undefined', () => {
    const obj = { user: undefined };
    expect(getNestedFieldValue(obj, 'user.name')).toBeUndefined();
  });

  it('should handle empty path', () => {
    const obj = { name: 'John' };
    expect(getNestedFieldValue(obj, '')).toBeUndefined();
  });

  it('should handle path with only dots', () => {
    const obj = { name: 'John' };
    expect(getNestedFieldValue(obj, '.')).toBeUndefined();
    expect(getNestedFieldValue(obj, '..')).toBeUndefined();
  });

  it('should handle numeric values in nested fields', () => {
    const obj = { user: { age: 30, count: 0 } };
    expect(getNestedFieldValue(obj, 'user.age')).toBe(30);
    expect(getNestedFieldValue(obj, 'user.count')).toBe(0);
  });

  it('should handle boolean values in nested fields', () => {
    const obj = { user: { active: true, verified: false } };
    expect(getNestedFieldValue(obj, 'user.active')).toBe(true);
    expect(getNestedFieldValue(obj, 'user.verified')).toBe(false);
  });

  it('should handle array values in nested fields', () => {
    const obj = { user: { tags: ['admin', 'user'] } };
    expect(getNestedFieldValue(obj, 'user.tags')).toEqual(['admin', 'user']);
  });

  it('should handle object values in nested fields', () => {
    const obj = { user: { metadata: { role: 'admin' } } };
    expect(getNestedFieldValue(obj, 'user.metadata')).toEqual({
      role: 'admin',
    });
  });

  it('should handle null values in nested fields', () => {
    const obj = { user: { email: null } };
    expect(getNestedFieldValue(obj, 'user.email')).toBeNull();
  });

  it('should handle empty string values', () => {
    const obj = { user: { name: '' } };
    expect(getNestedFieldValue(obj, 'user.name')).toBe('');
  });

  it('should handle very deeply nested paths', () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: { value: 'deep' },
            },
          },
        },
      },
    };
    expect(
      getNestedFieldValue(obj, 'level1.level2.level3.level4.level5.value'),
    ).toBe('deep');
  });

  it('should handle paths with special characters in field names', () => {
    const obj = { 'user-name': { 'email-addr': 'test@example.com' } };
    // Note: dot notation doesn't work with special characters, but the function should handle it
    expect(getNestedFieldValue(obj, 'user-name.email-addr')).toBe(
      'test@example.com',
    );
  });

  it('should return undefined when traversing through non-object types', () => {
    const obj = { user: { name: 'John' } };
    // Trying to access a property on a string should return undefined
    expect(getNestedFieldValue(obj, 'user.name.length')).toBeUndefined();
  });

  it('should handle paths that go through arrays (returns array, not array elements)', () => {
    const obj = { items: [{ name: 'item1' }] };
    // The function doesn't support array indexing, so it returns the array itself
    expect(getNestedFieldValue(obj, 'items')).toEqual([{ name: 'item1' }]);
  });
});
