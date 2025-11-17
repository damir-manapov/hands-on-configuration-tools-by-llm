import { describe, it, expect } from 'vitest';
import {
  noopNodePlugin,
  setNodePlugin,
  ifNodePlugin,
} from '../src/nodes/index.js';

describe('NodePlugin - Parameter Schema', () => {
  it('should export parameter schema for all built-in nodes', () => {
    const plugins = [noopNodePlugin, setNodePlugin, ifNodePlugin];

    for (const plugin of plugins) {
      const schema = plugin.getParameterSchema();

      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.fields).toBeDefined();
      expect(typeof schema.fields).toBe('object');

      // Verify JSON serializable
      expect(() => JSON.stringify(schema)).not.toThrow();
    }
  });
});
