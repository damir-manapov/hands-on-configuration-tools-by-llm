import { describe, it, expect } from 'vitest';
import { startNodePlugin, setNodePlugin, ifNodePlugin } from '../src/nodes/index.js';

describe('NodePlugin - Parameter Schema', () => {
  it('should export parameter schema for start node', () => {
    const schema = startNodePlugin.getParameterSchema();
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should export parameter schema for set node', () => {
    const schema = setNodePlugin.getParameterSchema();
    const validParams = {
      values: [
        { name: 'field1', value: 'value1' },
        { name: 'field2', value: 'value2' },
      ],
    };
    const result = schema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should export parameter schema for if node', () => {
    const schema = ifNodePlugin.getParameterSchema();
    const validParams = {
      conditions: {
        leftValue: 'status',
        rightValue: 'active',
        operator: 'equals',
      },
    };
    const result = schema.safeParse(validParams);
    expect(result.success).toBe(true);
  });

  it('should reject invalid parameters for set node', () => {
    const schema = setNodePlugin.getParameterSchema();
    const invalidParams = {
      values: 'not-an-array',
    };
    const result = schema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject invalid parameters for if node', () => {
    const schema = ifNodePlugin.getParameterSchema();
    const invalidParams = {
      conditions: {
        leftValue: 'status',
        rightValue: 'active',
        operator: 'invalid-operator',
      },
    };
    const result = schema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
});

