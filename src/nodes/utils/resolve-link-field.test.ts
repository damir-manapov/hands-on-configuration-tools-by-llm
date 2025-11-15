import { describe, it, expect } from 'vitest';
import { resolveLinkField } from './resolve-link-field.js';
import type { FieldResolver, TypedField } from '../../types.js';
import {
  CannotTraverseError,
  NullFieldError,
  ResolverFailedError,
  UnexpectedObjectValueError,
} from '../../errors/index.js';

describe('resolveLinkField', () => {
  it('should resolve a link field with a string value', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = (value, entityName) => {
      if (entityName === 'user' && value === '123') {
        return {
          id: { value: '123', kind: 'primitive' },
          name: { value: 'John', kind: 'primitive' },
        };
      }
      throw new Error(
        `Unexpected resolver call: entityName=${entityName}, value=${String(value)}`,
      );
    };
    const resolved = await resolveLinkField(field, resolver);
    expect(resolved).toEqual({
      id: { value: '123', kind: 'primitive' },
      name: { value: 'John', kind: 'primitive' },
    });
  });

  it('should resolve a link field with a number value', async () => {
    const field: TypedField = {
      value: 456,
      kind: 'link',
      entity: 'order',
    };
    const resolver: FieldResolver = (value, entityName) => {
      if (entityName === 'order' && value === 456) {
        return {
          id: { value: 456, kind: 'primitive' },
          total: { value: 99.99, kind: 'primitive' },
        };
      }
      throw new Error(
        `Unexpected resolver call: entityName=${entityName}, value=${String(value)}`,
      );
    };
    const resolved = await resolveLinkField(field, resolver);
    expect(resolved).toEqual({
      id: { value: 456, kind: 'primitive' },
      total: { value: 99.99, kind: 'primitive' },
    });
  });

  it('should work with sync resolver', async () => {
    const field: TypedField = {
      value: '789',
      kind: 'link',
      entity: 'product',
    };
    const resolver: FieldResolver = (value, entityName) => {
      if (entityName === 'product' && value === '789') {
        return {
          id: { value: '789', kind: 'primitive' },
          name: { value: 'Widget', kind: 'primitive' },
        };
      }
      throw new Error(
        `Unexpected resolver call: entityName=${entityName}, value=${String(value)}`,
      );
    };
    const resolved = await resolveLinkField(field, resolver);
    expect(resolved).toEqual({
      id: { value: '789', kind: 'primitive' },
      name: { value: 'Widget', kind: 'primitive' },
    });
  });

  it('should work with async resolver', async () => {
    const field: TypedField = {
      value: '999',
      kind: 'link',
      entity: 'order',
    };
    const resolver: FieldResolver = async (value, entityName) => {
      // Simulate async operation (e.g., database query)
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (entityName === 'order' && value === '999') {
        return {
          id: { value: '999', kind: 'primitive' },
          status: { value: 'pending', kind: 'primitive' },
          total: { value: 150.5, kind: 'primitive' },
        };
      }
      throw new Error(
        `Unexpected resolver call: entityName=${entityName}, value=${String(value)}`,
      );
    };
    const resolved = await resolveLinkField(field, resolver);
    expect(resolved).toEqual({
      id: { value: '999', kind: 'primitive' },
      status: { value: 'pending', kind: 'primitive' },
      total: { value: 150.5, kind: 'primitive' },
    });
  });

  it('should throw NullFieldError when value is null', async () => {
    const field: TypedField = {
      value: null,
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () => ({});
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      NullFieldError,
    );
  });

  it('should throw NullFieldError when value is undefined', async () => {
    const field: TypedField = {
      value: undefined,
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () => ({});
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      NullFieldError,
    );
  });

  it('should throw UnexpectedObjectValueError when value is already an object', async () => {
    const field: TypedField = {
      value: { name: { value: 'John', kind: 'primitive' } },
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () => ({});
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      UnexpectedObjectValueError,
    );
  });

  it('should throw CannotTraverseError when field is not a link field', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'primitive',
    };
    const resolver: FieldResolver = () => ({});
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      CannotTraverseError,
    );
  });

  it('should throw ResolverFailedError when resolver returns null', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () =>
      null as unknown as Record<string, TypedField>;
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      ResolverFailedError,
    );
  });

  it('should throw ResolverFailedError when resolver returns undefined', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () =>
      undefined as unknown as Record<string, TypedField>;
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      ResolverFailedError,
    );
  });

  it('should throw ResolverFailedError when resolver returns a primitive value', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () =>
      'resolved-string' as unknown as Record<string, TypedField>;
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      ResolverFailedError,
    );
  });

  it('should throw ResolverFailedError when resolver returns a number', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () =>
      42 as unknown as Record<string, TypedField>;
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      ResolverFailedError,
    );
  });

  it('should throw ResolverFailedError when resolver returns an array', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () =>
      [{ id: { value: '123', kind: 'primitive' } }] as unknown as Record<
        string,
        TypedField
      >;
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      ResolverFailedError,
    );
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      'Resolver returned an array',
    );
  });

  it('should pass correct value and entityName to resolver', async () => {
    const field: TypedField = {
      value: 'test-value',
      kind: 'link',
      entity: 'test-entity',
    };
    let receivedValue: unknown = undefined;
    let receivedEntityName = '';
    const resolver: FieldResolver = (value, entityName) => {
      receivedValue = value;
      receivedEntityName = entityName;
      return {
        resolved: { value: true, kind: 'primitive' },
      };
    };
    await resolveLinkField(field, resolver);
    expect(receivedValue).toBe('test-value');
    expect(receivedEntityName).toBe('test-entity');
  });

  it('should return the resolved object when resolver succeeds', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const expectedResult: Record<string, TypedField> = {
      id: { value: '123', kind: 'primitive' },
      name: { value: 'John', kind: 'primitive' },
      email: { value: 'john@example.com', kind: 'primitive' },
    };
    const resolver: FieldResolver = () => expectedResult;
    const result = await resolveLinkField(field, resolver);
    expect(result).toBe(expectedResult);
  });

  it('should throw ResolverFailedError when resolver returns object with invalid nested TypedField', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () =>
      ({
        id: { value: '123', kind: 'primitive' },
        profile: { name: 'John' }, // Not a TypedField - missing 'value' and 'kind'
      }) as unknown as Record<string, TypedField>;
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      ResolverFailedError,
    );
    // Zod reports the specific property that's missing/invalid
    await expect(resolveLinkField(field, resolver)).rejects.toThrow('profile.');
  });

  it('should throw ResolverFailedError when resolver returns object with invalid deeply nested TypedField', async () => {
    const field: TypedField = {
      value: '123',
      kind: 'link',
      entity: 'user',
    };
    const resolver: FieldResolver = () => ({
      id: { value: '123', kind: 'primitive' },
      user: {
        value: {
          name: { value: 'John', kind: 'primitive' },
          profile: { name: 'John' }, // Not a TypedField
        },
        kind: 'primitive',
      },
    });
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      ResolverFailedError,
    );
    // Zod reports error at the 'value' level when union validation fails
    // The full path includes the top-level key
    await expect(resolveLinkField(field, resolver)).rejects.toThrow(
      'user.value:',
    );
  });
});
