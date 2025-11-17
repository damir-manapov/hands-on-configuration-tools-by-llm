import { describe, it, expect } from 'vitest';
import { noopNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Noop Node - Validation', () => {
  it('should accept noop node with empty parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Noop',
      type: 'builtIn.noop',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: {},
    };

    expect(() => {
      noopNodePlugin.validate(node);
    }).not.toThrow();
  });
});
