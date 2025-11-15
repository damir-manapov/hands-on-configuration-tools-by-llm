import { describe, it, expect } from 'vitest';
import { evaluateCondition } from './evaluate-condition.js';
import { toTypedFieldInput } from './to-typed-field-input.js';
import {
  FieldNotFoundError,
  IncomparableFieldValueError,
} from '../../errors/index.js';

describe('evaluateCondition', () => {
  it('should return true for equals operator when values match', async () => {
    const input = toTypedFieldInput([[{ status: 'active' }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'status',
      value: 'active',
      operator: 'equals' as const,
    };

    const result = await evaluateCondition(item, condition);

    expect(result).toBe(true);
  });

  it('should return false for equals operator when values do not match', async () => {
    const input = toTypedFieldInput([[{ status: 'inactive' }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'status',
      value: 'active',
      operator: 'equals' as const,
    };

    const result = await evaluateCondition(item, condition);

    expect(result).toBe(false);
  });

  it('should return true for notEquals operator when values do not match', async () => {
    const input = toTypedFieldInput([[{ status: 'inactive' }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'status',
      value: 'active',
      operator: 'notEquals' as const,
    };

    const result = await evaluateCondition(item, condition);

    expect(result).toBe(true);
  });

  it('should return true for contains operator when value contains substring', async () => {
    const input = toTypedFieldInput([[{ message: 'error occurred' }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'message',
      value: 'error',
      operator: 'contains' as const,
    };

    const result = await evaluateCondition(item, condition);

    expect(result).toBe(true);
  });

  it('should return false for contains operator when value does not contain substring', async () => {
    const input = toTypedFieldInput([[{ message: 'success' }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'message',
      value: 'error',
      operator: 'contains' as const,
    };

    const result = await evaluateCondition(item, condition);

    expect(result).toBe(false);
  });

  it('should throw FieldNotFoundError when field is missing', async () => {
    const input = toTypedFieldInput([[{ other: 'field' }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'missing',
      value: 'value',
      operator: 'equals' as const,
    };

    await expect(evaluateCondition(item, condition)).rejects.toThrow(
      FieldNotFoundError,
    );
  });

  it('should convert numbers to strings for comparison', async () => {
    const input = toTypedFieldInput([[{ count: 5 }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'count',
      value: '5',
      operator: 'equals' as const,
    };

    const result = await evaluateCondition(item, condition);

    expect(result).toBe(true);
  });

  it('should convert booleans to strings for comparison', async () => {
    const input = toTypedFieldInput([[{ enabled: true }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'enabled',
      value: 'true',
      operator: 'equals' as const,
    };

    const result = await evaluateCondition(item, condition);

    expect(result).toBe(true);
  });

  it('should throw IncomparableFieldValueError when field value is an object', async () => {
    const input = toTypedFieldInput([[{ user: { name: 'John', age: 30 } }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'user',
      value: 'John',
      operator: 'equals' as const,
    };

    await expect(evaluateCondition(item, condition)).rejects.toThrow(
      IncomparableFieldValueError,
    );
    await expect(evaluateCondition(item, condition)).rejects.toThrow(
      'cannot be compared',
    );
  });

  it('should throw IncomparableFieldValueError when field value is an array', async () => {
    const input = toTypedFieldInput([[{ tags: ['tag1', 'tag2'] }]]);
    const item = input[0]![0]!;
    const condition = {
      path: 'tags',
      value: 'tag1',
      operator: 'equals' as const,
    };

    await expect(evaluateCondition(item, condition)).rejects.toThrow(
      IncomparableFieldValueError,
    );
    await expect(evaluateCondition(item, condition)).rejects.toThrow(
      'cannot be compared',
    );
  });
});
