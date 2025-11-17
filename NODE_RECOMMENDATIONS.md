# Node Type Recommendations

This document outlines recommended node types to add to the workflow engine, prioritized by value and implementation complexity.

## Current Node Types

The engine currently supports:

- **Noop** (`builtIn.noop`) - Entry point/pass-through node for workflows
- **Set** (`builtIn.set`) - Add/overwrite fields with static values
- **Marker** (`builtIn.marker`) - Marks data items with \_matched field based on condition (does not route)
- **If** (`builtIn.if`) - Conditional routing node that routes data to "true" or "false" output ports based on a condition
- **Switch** (`builtIn.switch`) - Multi-branch conditional routing with dynamically defined output ports based on multiple conditions
- **Code** (`builtIn.code`) - Execute custom JavaScript code
- **Filter** (`builtIn.filter`) - Filter items based on conditions

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

### 2. Merge (`builtIn.merge`)

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

## Medium Priority (Data Transformation)

### 3. Transform (`builtIn.transform`)

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

### 4. JSON (`builtIn.json`)

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

### 5. Wait/Delay (`builtIn.wait`)

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

### 6. Set Variable / Get Variable (`builtIn.setVariable` / `builtIn.getVariable`)

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

## Additional Recommended Nodes

### 7. Aggregate/Group (`builtIn.aggregate`)

**Priority: ⭐⭐⭐⭐**

**Purpose:** Group items by field values and perform aggregations (sum, count, average, min, max, etc.).

**Parameters:**

- `groupBy`: Field name to group by
- `aggregations`: Array of aggregation operations
  - `field`: Field to aggregate
  - `operation`: sum, count, average, min, max, first, last, concat
  - `outputField`: Name of output field for result

**Use Cases:**

- Calculate totals and statistics
- Group data by categories
- Aggregate time-series data
- Generate reports and summaries

**Implementation Complexity:** Medium

- Need to handle grouping logic
- Various aggregation operations
- Should preserve group structure

---

### 8. Sort (`builtIn.sort`)

**Priority: ⭐⭐⭐**

**Purpose:** Sort items by one or more fields in ascending or descending order.

**Parameters:**

- `sortBy`: Array of sort criteria
  - `field`: Field name to sort by
  - `direction`: asc or desc
- `nullsFirst`: Whether null values should come first (default: false)

**Use Cases:**

- Order data for display
- Prepare data for processing
- Sort before grouping or aggregating

**Implementation Complexity:** Low

- Use JavaScript sort with custom comparator
- Handle nested field paths
- Support multiple sort criteria

---

### 9. Limit/Take (`builtIn.limit`)

**Priority: ⭐⭐⭐**

**Purpose:** Limit the number of items in the output, optionally skipping items.

**Parameters:**

- `limit`: Maximum number of items to output
- `skip`: Number of items to skip before starting (default: 0)

**Use Cases:**

- Pagination
- Sampling data
- Limiting large datasets
- Top N queries

**Implementation Complexity:** Very Low

- Simple array slice operation
- Handle edge cases (empty input, limit > length)

---

### 10. Deduplicate (`builtIn.deduplicate`)

**Priority: ⭐⭐⭐**

**Purpose:** Remove duplicate items based on field values or entire item comparison.

**Parameters:**

- `keyFields`: Array of field names to use for comparison (if empty, compares entire item)
- `keep`: Which duplicate to keep - first, last, or all (default: first)

**Use Cases:**

- Remove duplicate records
- Clean data
- Ensure uniqueness

**Implementation Complexity:** Low

- Use Set or Map for deduplication
- Handle nested field comparison
- Preserve order

---

### 11. Split (`builtIn.split`)

**Priority: ⭐⭐⭐**

**Purpose:** Split data into multiple outputs based on conditions or chunk size.

**Parameters:**

- `mode`: Split mode
  - `byCondition`: Split by condition (like Switch but outputs all items)
  - `byChunkSize`: Split into fixed-size chunks
  - `byField`: Split by distinct field values
- `chunkSize`: Size of chunks (for byChunkSize mode)
- `field`: Field name (for byField mode)

**Use Cases:**

- Batch processing
- Parallel processing preparation
- Data partitioning

**Implementation Complexity:** Medium

- Similar to Switch but with different output structure
- Handle dynamic outputs for byField mode
- Preserve batch structure

---

### 12. Flatten (`builtIn.flatten`)

**Priority: ⭐⭐**

**Purpose:** Flatten nested arrays or objects into a flat structure.

**Parameters:**

- `mode`: Flatten mode
  - `arrays`: Flatten nested arrays
  - `objects`: Flatten nested objects (dot notation)
  - `both`: Flatten both arrays and objects
- `depth`: Maximum depth to flatten (default: Infinity)
- `separator`: Separator for object keys (default: '.')

**Use Cases:**

- Normalize nested data structures
- Prepare data for processing
- Simplify complex structures

**Implementation Complexity:** Medium

- Recursive flattening logic
- Handle various data types
- Preserve or transform keys

---

### 13. Error Handler (`builtIn.errorHandler`)

**Priority: ⭐⭐⭐**

**Purpose:** Catch and handle errors from previous nodes, allowing workflows to continue.

**Parameters:**

- `onError`: Error handling strategy
  - `continue`: Continue with empty/default data
  - `retry`: Retry the operation
  - `fallback`: Use fallback data
- `fallbackData`: Data to use when error occurs (for fallback strategy)
- `maxRetries`: Maximum retry attempts (for retry strategy)
- `retryDelay`: Delay between retries in milliseconds

**Use Cases:**

- Graceful error handling
- Retry failed operations
- Fallback data sources
- Resilient workflows

**Implementation Complexity:** Medium-High

- Requires engine support for error propagation
- Need to track error state
- Handle retry logic

---

### 14. Log/Debug (`builtIn.log`)

**Priority: ⭐⭐**

**Purpose:** Log data for debugging and monitoring without affecting the workflow.

**Parameters:**

- `level`: Log level (debug, info, warn, error)
- `fields`: Array of field names to log (if empty, logs entire item)
- `format`: Output format (json, table, custom)
- `label`: Label to identify this log point

**Use Cases:**

- Debugging workflows
- Monitoring data flow
- Inspecting intermediate results
- Audit trails

**Implementation Complexity:** Low

- Simple logging wrapper
- Format data appropriately
- Pass through data unchanged

---

### 15. Batch/Unbatch (`builtIn.batch`)

**Priority: ⭐⭐**

**Purpose:** Control batch sizes - combine batches or split large batches.

**Parameters:**

- `operation`: batch or unbatch
- `batchSize`: Target batch size (for batch operation)
- `preserveBatches`: Whether to preserve original batch boundaries (for unbatch)

**Use Cases:**

- Optimize processing
- Control memory usage
- Prepare data for batch operations

**Implementation Complexity:** Low-Medium

- Array manipulation
- Handle edge cases
- Preserve data structure

---

## Recommended Implementation Order

### High Priority
1. **HTTP Request** - Most requested, enables integrations
2. **Merge** - Essential for combining parallel execution paths
3. **Aggregate/Group** - Common data analysis operation
4. **Sort** - Frequently needed for data preparation

### Medium Priority
5. **Transform** - Flexible data manipulation
6. **JSON** - Simple but useful for API integrations
7. **Limit/Take** - Simple but useful utility
8. **Deduplicate** - Common data cleaning operation
9. **Split** - Useful for parallel processing

### Lower Priority
10. **Wait/Delay** - Simple utility node
11. **Flatten** - Niche but useful transformation
12. **Log/Debug** - Development and debugging tool
13. **Batch/Unbatch** - Performance optimization
14. **Error Handler** - Requires engine modifications
15. **Set/Get Variable** - Requires engine modifications

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
   - For nodes with dynamic output ports (based on parameters), set `dynamicOutputsAllowed: true` and validate output ports in the `validate` function

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
