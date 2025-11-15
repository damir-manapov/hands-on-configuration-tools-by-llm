import { describe, it, expect } from 'vitest';
import { getNestedFieldValue } from './get-nested-field-value.js';
import type { FieldResolver, TypedField } from '../../types.js';
import {
  CannotTraverseError,
  FieldNotFoundError,
  NullFieldError,
  ResolverFailedError,
  ResolverRequiredError,
} from '../../errors/index.js';

describe('getNestedFieldValue', () => {
  describe('basic field access', () => {
    it('should get a top-level field', async () => {
      const obj: TypedField = {
        value: {
          name: { value: 'John', kind: 'primitive' },
        },
        kind: 'primitive',
      };
      const result = await getNestedFieldValue(obj, 'name');
      expect(result).toEqual({ value: 'John', kind: 'primitive' });
    });

    it('should get a nested field', async () => {
      const obj: TypedField = {
        value: {
          user: {
            value: {
              name: { value: 'John', kind: 'primitive' },
            },
            kind: 'primitive',
          },
        },
        kind: 'primitive',
      };
      const result = await getNestedFieldValue(obj, 'user.name');
      expect(result).toEqual({ value: 'John', kind: 'primitive' });
    });

    it('should get a deeply nested field', async () => {
      const obj: TypedField = {
        value: {
          user: {
            value: {
              profile: {
                value: {
                  name: { value: 'John', kind: 'primitive' },
                },
                kind: 'primitive',
              },
            },
            kind: 'primitive',
          },
        },
        kind: 'primitive',
      };
      const result = await getNestedFieldValue(obj, 'user.profile.name');
      expect(result).toEqual({ value: 'John', kind: 'primitive' });
    });
  });

  describe('field access with resolution', () => {
    it('should resolve a link field and access nested field', async () => {
      const userRepository = new Map<string, Record<string, TypedField>>([
        [
          '123',
          {
            name: { value: 'John', kind: 'primitive' },
            email: { value: 'john@example.com', kind: 'primitive' },
          },
        ],
      ]);

      const resolver: FieldResolver = (value, entityName) => {
        if (entityName === 'user' && typeof value === 'string') {
          const result = userRepository.get(value);
          if (!result) {
            throw new Error(`User not found: ${value}`);
          }
          return result;
        }
        throw new Error(
          `Unexpected resolver call: entityName=${entityName}, value=${String(value)}`,
        );
      };

      const obj: TypedField = {
        value: {
          userId: {
            value: '123',
            kind: 'link',
            entity: 'user',
          },
        },
        kind: 'primitive',
      };

      const nameField = await getNestedFieldValue(obj, 'userId.name', resolver);
      expect(nameField).toEqual({ value: 'John', kind: 'primitive' });
    });

    it('should resolve multiple link fields in path', async () => {
      const userRepository = new Map<string, Record<string, TypedField>>([
        [
          '123',
          {
            profileId: {
              value: 'p1',
              kind: 'link',
              entity: 'profile',
            },
          },
        ],
      ]);

      const profileRepository = new Map<string, Record<string, TypedField>>([
        [
          'p1',
          {
            bio: { value: 'Developer', kind: 'primitive' },
          },
        ],
      ]);

      const resolver: FieldResolver = (value, entityName) => {
        if (entityName === 'user' && typeof value === 'string') {
          const result = userRepository.get(value);
          if (!result) {
            throw new Error(`User not found: ${value}`);
          }
          return result;
        }
        if (entityName === 'profile' && typeof value === 'string') {
          const result = profileRepository.get(value);
          if (!result) {
            throw new Error(`Profile not found: ${value}`);
          }
          return result;
        }
        throw new Error(
          `Unexpected resolver call: entityName=${entityName}, value=${String(value)}`,
        );
      };

      const obj: TypedField = {
        value: {
          userId: {
            value: '123',
            kind: 'link',
            entity: 'user',
          },
        },
        kind: 'primitive',
      };

      const bioField = await getNestedFieldValue(
        obj,
        'userId.profileId.bio',
        resolver,
      );
      expect(bioField).toEqual({ value: 'Developer', kind: 'primitive' });
    });

    it('should work with async resolver', async () => {
      const userRepository = new Map<string, Record<string, TypedField>>([
        [
          '123',
          {
            name: { value: 'John', kind: 'primitive' },
          },
        ],
      ]);

      const resolver: FieldResolver = async (value, entityName) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (entityName === 'user' && typeof value === 'string') {
          const result = userRepository.get(value);
          if (!result) {
            throw new Error(`User not found: ${value}`);
          }
          return result;
        }
        throw new Error(
          `Unexpected resolver call: entityName=${entityName}, value=${String(value)}`,
        );
      };

      const obj: TypedField = {
        value: {
          userId: {
            value: '123',
            kind: 'link',
            entity: 'user',
          },
        },
        kind: 'primitive',
      };

      const nameField = await getNestedFieldValue(obj, 'userId.name', resolver);
      expect(nameField).toEqual({ value: 'John', kind: 'primitive' });
    });
  });

  describe('error cases', () => {
    describe('NullFieldError', () => {
      it('should throw when obj.value is null', async () => {
        const obj: TypedField = {
          value: null,
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'name')).rejects.toThrow(
          NullFieldError,
        );
      });

      it('should throw when obj.value is undefined', async () => {
        const obj: TypedField = {
          value: undefined,
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'name')).rejects.toThrow(
          NullFieldError,
        );
      });

      it('should throw when field value is null in path', async () => {
        const obj: TypedField = {
          value: {
            user: {
              value: null,
              kind: 'primitive',
            },
          },
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'user.name')).rejects.toThrow(
          NullFieldError,
        );
      });

      it('should throw when field value is undefined in path', async () => {
        const obj: TypedField = {
          value: {
            user: {
              value: undefined,
              kind: 'primitive',
            },
          },
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'user.name')).rejects.toThrow(
          NullFieldError,
        );
      });
    });

    describe('CannotTraverseError', () => {
      it('should throw when obj.value is not an object', async () => {
        const obj: TypedField = {
          value: 'not-an-object',
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'name')).rejects.toThrow(
          CannotTraverseError,
        );
      });

      it('should throw when obj.value is an array', async () => {
        const obj: TypedField = {
          value: [],
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'name')).rejects.toThrow(
          CannotTraverseError,
        );
      });

      it('should throw when trying to traverse a primitive value', async () => {
        const obj: TypedField = {
          value: {
            name: { value: 'John', kind: 'primitive' },
          },
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'name.email')).rejects.toThrow(
          CannotTraverseError,
        );
      });

      it('should throw when trying to traverse a non-link primitive', async () => {
        const obj: TypedField = {
          value: {
            userId: {
              value: '123',
              kind: 'primitive', // Not a link, can't resolve
            },
          },
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'userId.name')).rejects.toThrow(
          CannotTraverseError,
        );
      });
    });

    describe('FieldNotFoundError', () => {
      it('should throw when field does not exist', async () => {
        const obj: TypedField = {
          value: {
            name: { value: 'John', kind: 'primitive' },
          },
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'email')).rejects.toThrow(
          FieldNotFoundError,
        );
      });

      it('should throw when nested field does not exist', async () => {
        const obj: TypedField = {
          value: {
            user: {
              value: {
                name: { value: 'John', kind: 'primitive' },
              },
              kind: 'primitive',
            },
          },
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'user.email')).rejects.toThrow(
          FieldNotFoundError,
        );
      });
    });

    describe('ResolverRequiredError', () => {
      it('should throw when resolver is required but not provided', async () => {
        const obj: TypedField = {
          value: {
            userId: {
              value: '123',
              kind: 'link',
              entity: 'user',
            },
          },
          kind: 'primitive',
        };
        await expect(getNestedFieldValue(obj, 'userId.name')).rejects.toThrow(
          ResolverRequiredError,
        );
      });
    });

    describe('ResolverFailedError', () => {
      it('should throw when resolver returns null', async () => {
        const resolver: FieldResolver = () =>
          null as unknown as Record<string, TypedField>;

        const obj: TypedField = {
          value: {
            userId: {
              value: '123',
              kind: 'link',
              entity: 'user',
            },
          },
          kind: 'primitive',
        };
        await expect(
          getNestedFieldValue(obj, 'userId.name', resolver),
        ).rejects.toThrow(ResolverFailedError);
      });

      it('should throw when resolver returns undefined', async () => {
        const resolver: FieldResolver = () =>
          undefined as unknown as Record<string, TypedField>;

        const obj: TypedField = {
          value: {
            userId: {
              value: '123',
              kind: 'link',
              entity: 'user',
            },
          },
          kind: 'primitive',
        };
        await expect(
          getNestedFieldValue(obj, 'userId.name', resolver),
        ).rejects.toThrow(ResolverFailedError);
      });

      it('should throw when resolver returns a primitive', async () => {
        const resolver: FieldResolver = () =>
          'not-an-object' as unknown as Record<string, TypedField>;

        const obj: TypedField = {
          value: {
            userId: {
              value: '123',
              kind: 'link',
              entity: 'user',
            },
          },
          kind: 'primitive',
        };
        await expect(
          getNestedFieldValue(obj, 'userId.name', resolver),
        ).rejects.toThrow(ResolverFailedError);
      });

      it('should throw when resolver returns an array', async () => {
        const resolver: FieldResolver = () =>
          [] as unknown as Record<string, TypedField>;

        const obj: TypedField = {
          value: {
            userId: {
              value: '123',
              kind: 'link',
              entity: 'user',
            },
          },
          kind: 'primitive',
        };
        await expect(
          getNestedFieldValue(obj, 'userId.name', resolver),
        ).rejects.toThrow(ResolverFailedError);
      });

      it('should throw when resolver returns invalid TypedField structure', async () => {
        const resolver: FieldResolver = () =>
          ({
            name: 'John', // Not a TypedField
          }) as unknown as Record<string, TypedField>;

        const obj: TypedField = {
          value: {
            userId: {
              value: '123',
              kind: 'link',
              entity: 'user',
            },
          },
          kind: 'primitive',
        };
        await expect(
          getNestedFieldValue(obj, 'userId.name', resolver),
        ).rejects.toThrow(ResolverFailedError);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle mixed object traversal and resolution', async () => {
      const userRepository = new Map<string, Record<string, TypedField>>([
        [
          '123',
          {
            addressId: {
              value: 'addr1',
              kind: 'link',
              entity: 'address',
            },
          },
        ],
      ]);

      const addressRepository = new Map<string, Record<string, TypedField>>([
        [
          'addr1',
          {
            city: { value: 'NYC', kind: 'primitive' },
          },
        ],
      ]);

      const resolver: FieldResolver = (value, entityName) => {
        if (entityName === 'user' && typeof value === 'string') {
          const result = userRepository.get(value);
          if (!result) {
            throw new Error(`User not found: ${value}`);
          }
          return result;
        }
        if (entityName === 'address' && typeof value === 'string') {
          const result = addressRepository.get(value);
          if (!result) {
            throw new Error(`Address not found: ${value}`);
          }
          return result;
        }
        throw new Error(
          `Unexpected resolver call: entityName=${entityName}, value=${String(value)}`,
        );
      };

      const obj: TypedField = {
        value: {
          userId: {
            value: '123',
            kind: 'link',
            entity: 'user',
          },
        },
        kind: 'primitive',
      };

      const cityField = await getNestedFieldValue(
        obj,
        'userId.addressId.city',
        resolver,
      );
      expect(cityField).toEqual({ value: 'NYC', kind: 'primitive' });
    });

    it('should handle different primitive types', async () => {
      const obj: TypedField = {
        value: {
          name: { value: 'John', kind: 'primitive' },
          age: { value: 30, kind: 'primitive' },
          active: { value: true, kind: 'primitive' },
        },
        kind: 'primitive',
      };

      expect(await getNestedFieldValue(obj, 'name')).toEqual({
        value: 'John',
        kind: 'primitive',
      });
      expect(await getNestedFieldValue(obj, 'age')).toEqual({
        value: 30,
        kind: 'primitive',
      });
      expect(await getNestedFieldValue(obj, 'active')).toEqual({
        value: true,
        kind: 'primitive',
      });
    });
  });
});
