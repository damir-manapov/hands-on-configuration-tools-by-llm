# Node Type Recommendations

This document outlines recommended node types to add to the workflow engine, prioritized by value and implementation complexity.

## Current Node Types

The engine currently supports:

- **Start** (`builtIn.start`) - Entry point for workflows
- **Set** (`builtIn.set`) - Add/overwrite fields with static values
- **If** (`builtIn.if`) - Conditional routing based on single condition

## High Priority (Core Workflow Patterns)

### 1. HTTP Request (`builtIn.httpRequest`)

**Priority: ⭐⭐⭐⭐⭐**

**Purpose:** Make HTTP/HTTPS requests to external APIs and services.

**Parameters:**

- `method`: HTTP method (GET, POST, PUT, DELETE, PATCH)
- `url`: Request URL
- `headers`: Request headers (key-value pairs)
- `body`: Request body (string or JSON)
- `authentication`: Authentication configuration (basic, bearer, etc.)
- `timeout`: Request timeout in milliseconds

**Use Cases:**

- Integrate with external APIs
- Fetch data from web services
- Send webhooks
- LLM-driven workflows that need to interact with external systems

**Implementation Complexity:** Medium

- Requires HTTP client (fetch API or node-fetch)
- Need to handle errors, timeouts, and response parsing
- Should support various authentication methods

---

### 2. Switch (`builtIn.switch`)

**Priority: ⭐⭐⭐⭐⭐**

**Purpose:** Multi-branch conditional routing (extends If node functionality).

**Parameters:**

- `rules`: Array of rules, each with:
  - `condition`: Similar to If node conditions
  - `output`: Output index for this rule
- `fallbackOutput`: Output index for items that don't match any rule

**Use Cases:**

- Route data to different branches based on multiple conditions
- Implement complex decision trees
- Categorize data into multiple buckets

**Implementation Complexity:** Low-Medium

- Similar to If node but with multiple outputs
- Need to handle routing to different output connections

---

### 3. Merge (`builtIn.merge`)

**Priority: ⭐⭐⭐⭐**

**Purpose:** Combine multiple data streams into a single stream.

**Parameters:**

- `mode`: Merge mode
  - `append`: Append all items sequentially
  - `merge`: Merge items by index (first with first, second with second)
  - `overwrite`: Overwrite fields from later streams
- `mergeBy`: Field name to merge by (for key-based merging)

**Use Cases:**

- Combine parallel workflow branches
- Merge data from multiple sources
- Aggregate results from different operations

**Implementation Complexity:** Low-Medium

- Need to handle different merge modes
- Should preserve data structure appropriately

---

### 4. Filter (`builtIn.filter`)

**Priority: ⭐⭐⭐⭐**

**Purpose:** Filter items based on conditions, outputting only matching items.

**Parameters:**

- `conditions`: Similar to If node (leftValue, rightValue, operator)
- `mode`: Filter mode
  - `pass`: Pass items that match
  - `drop`: Drop items that match

**Use Cases:**

- Remove unwanted data items
- Select specific records based on criteria
- Data cleaning and preprocessing

**Implementation Complexity:** Low

- Very similar to If node
- Just need to filter the output array

---

## Medium Priority (Data Transformation)

### 5. Transform (`builtIn.transform`)

**Priority: ⭐⭐⭐**

**Purpose:** Transform data structure with field mappings, renaming, and transformations.

**Parameters:**

- `transformations`: Array of transformation rules
  - `operation`: rename, remove, add, modify
  - `from`: Source field name
  - `to`: Target field name
  - `value`: Value for add/modify operations

**Use Cases:**

- Rename fields
- Restructure data objects
- Add computed fields
- Remove sensitive data

**Implementation Complexity:** Medium

- Need to handle various transformation operations
- Should support nested field paths

---

### 6. Code/Function (`builtIn.code`)

**Priority: ⭐⭐⭐**

**Purpose:** Execute custom JavaScript/TypeScript code.

**Parameters:**

- `code`: Code string to execute
- `language`: Language (javascript, typescript)
- `timeout`: Execution timeout

**Use Cases:**

- Custom business logic
- Complex calculations
- Data manipulation that can't be done with other nodes

**Implementation Complexity:** High

- Security concerns (sandboxing)
- Need to provide safe execution environment
- Should have access to input data and utilities

**Security Note:** Requires careful sandboxing to prevent code injection attacks.

---

### 7. JSON (`builtIn.json`)

**Priority: ⭐⭐⭐**

**Purpose:** Parse and stringify JSON data.

**Parameters:**

- `operation`: parse or stringify
- `jsonString`: JSON string (for parse operation)
- `options`: Additional options (pretty print, etc.)

**Use Cases:**

- Parse JSON from API responses
- Convert objects to JSON strings
- Handle JSON data transformations

**Implementation Complexity:** Low

- Simple JSON.parse/JSON.stringify wrapper
- Error handling for invalid JSON

---

## Lower Priority (Utility Nodes)

### 8. Wait/Delay (`builtIn.wait`)

**Priority: ⭐⭐**

**Purpose:** Add delays between node executions.

**Parameters:**

- `duration`: Delay duration
- `unit`: milliseconds, seconds, minutes

**Use Cases:**

- Rate limiting
- Retry logic with delays
- Scheduled workflows

**Implementation Complexity:** Low

- Simple setTimeout/Promise delay
- Should be async

---

### 9. NoOp (`builtIn.noOp`)

**Priority: ⭐⭐**

**Purpose:** Pass-through node that does nothing (useful for debugging and workflow structure).

**Parameters:** None

**Use Cases:**

- Debugging workflows
- Workflow structure/organization
- Placeholder nodes

**Implementation Complexity:** Very Low

- Just pass input to output

---

### 10. Set Variable / Get Variable (`builtIn.setVariable` / `builtIn.getVariable`)

**Priority: ⭐⭐**

**Purpose:** Store and retrieve workflow-level variables.

**Parameters:**

- `variableName`: Name of the variable
- `value`: Value to set (for Set Variable)
- `defaultValue`: Default value if variable doesn't exist (for Get Variable)

**Use Cases:**

- Share data across workflow execution
- Store intermediate results
- Configuration values

**Implementation Complexity:** Medium

- Need to add variable storage to WorkflowEngine
- Should persist during workflow execution
- May need to handle variable scoping

---

## Recommended Implementation Order

1. **HTTP Request** - Most requested, enables integrations
2. **Switch** - Extends conditional logic capabilities
3. **Merge** - Essential for combining parallel execution paths
4. **Filter** - Common data operation, simple to implement
5. **Transform** - Flexible data manipulation
6. **JSON** - Simple but useful for API integrations
7. **Wait/Delay** - Simple utility node
8. **NoOp** - Simplest node, good for testing infrastructure
9. **Code/Function** - Complex but powerful (requires security considerations)
10. **Set/Get Variable** - Requires engine modifications

## Implementation Guidelines

When implementing new nodes:

1. **Follow the existing pattern:**
   - Create node directory: `src/nodes/{node-name}/`
   - Create `index.ts` with validation and execution functions
   - Use Zod for parameter validation
   - Create execution and validation tests

2. **Use the plugin system:**
   - Nodes are automatically registered via the plugin system
   - Built-in nodes are registered in the WorkflowEngine constructor

3. **Error handling:**
   - Use custom error classes from `src/errors.ts`
   - Provide clear error messages

4. **Testing:**
   - Create execution tests: `src/nodes/{node-name}/execution.test.ts`
   - Create validation tests: `src/nodes/{node-name}/validation.test.ts`
   - Test edge cases and error conditions

5. **Documentation:**
   - Document parameters clearly
   - Provide usage examples
   - Note any limitations or security considerations

## Notes for LLM Configuration

When designing nodes for LLM configuration:

- **Clear parameter schemas** - LLMs need well-defined structures
- **Descriptive names** - Help LLMs understand node purpose
- **Consistent patterns** - Similar nodes should follow similar patterns
- **Validation messages** - Clear errors help LLMs fix configurations
- **Examples** - Consider adding example configurations
