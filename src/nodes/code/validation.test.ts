import { describe, it, expect } from 'vitest';
import { codeNodePlugin } from './index.js';
import type { WorkflowNode } from '../../types.js';

describe('Code Node - Validation', () => {
  it('should throw error when code node is missing code parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {},
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when code node has invalid code parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 123, // not a string
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when code node has invalid timeout parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return input;',
        timeout: 'not-a-number',
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should validate code node with valid parameters', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return input;',
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).not.toThrow();
  });

  it('should validate code node with timeout parameter', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return input;',
        timeout: 10000,
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).not.toThrow();
  });

  it('should throw error when code has syntax errors', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return { invalid syntax }',
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).toThrow('Code syntax error');
  });

  it('should throw error when code has missing brackets', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return input.map(item => {',
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).toThrow('Code syntax error');
  });

  it('should throw error when code has invalid token', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: 'return @invalid;',
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).toThrow('Code syntax error');
  });

  it('should throw error when code is empty', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: '',
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });

  it('should throw error when code is only whitespace', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      name: 'Code Node',
      type: 'builtIn.code',
      position: { x: 0, y: 0 },
      parameters: {
        code: '   \n\t  ',
      },
      connections: [],
    };

    expect(() => {
      codeNodePlugin.validate(node);
    }).toThrow('has invalid parameters');
  });
});
