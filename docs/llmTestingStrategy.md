## LLM E2E Configuration Testing

This document describes how to evaluate large-language-model–driven configuration of the workflow engine without humans in the loop.

### Scenario Corpus
- Encode each task as structured data (JSON/YAML) containing: prompt text, required nodes/constraints, validation inputs, expected outputs, acceptance notes.
- Version the corpus so changes to requirements are traceable.
- Maintain **golden configurations** per scenario. Store one or more vetted workflow JSON files that satisfy the requirements for comparison.

### Fully Automated Pipeline
1. **Spin up environment**: start the workflow engine, MCP server, and any mock dependencies in a sandbox.
2. **Drive the LLM**: programmatic MCP client feeds the scenario prompt to the model, relays tool/resource calls, and archives all interactions.
3. **Capture artifacts**: persist the workflow config, any generated validation tests, and logs for each attempt.
4. **Apply config**: load the workflow definition into a test instance of the engine using an API/CLI call.
5. **Run validations**:
   - Execute harness-defined fixtures to ensure outputs match expectations.
   - Run LLM-authored tests (when provided) for extra coverage, but always keep harness tests as the ground truth.
6. **Passive acceptance**: if all validations pass, mark the attempt successful; otherwise, capture failure diagnostics for automatic feedback.

### Golden Corpus Management
- Diff the LLM-produced config against the stored golden configs:
  - If identical or equivalent, treat as canonical success.
  - If new but valid/efficient, auto-submit it for review or automatically append to the corpus after sanity checks (e.g., node count threshold, runtime metrics).
- Use the corpus to detect regressions (missing nodes, degraded structure) when models change.

### Metrics to Track
- Success rate per scenario (pass/fail).
- Attempts per scenario (number of runs before success).
- Wall-clock time and tool-call count for each attempt.
- Distance from nearest golden config (structural diff, node count, estimated cost).
- Runtime efficiency: execution time on validation inputs, resource utilization, number of parallel branches spawned.
- Failure taxonomy: schema errors, runtime exceptions, unmet requirements, inefficient design.

### Test Generation & Execution
- Prompt the LLM to output machine-readable validation tests alongside the workflow config.
- Automatically execute both harness tests and LLM-generated tests; require that harness tests pass even if LLM tests succeed.
- Store successfully generated tests and deduplicate them to grow the official scenario suite.

### Multiple Attempts Per Scenario
- Run each scenario several times (e.g., 3–5) per evaluation run to measure variance and capture alternative solutions.
- Aggregate metrics: mean/median success, best efficiency, diversity of produced configs.
- Useful for stress-testing prompts and verifying stability of LLM behavior.

### No-Human Operation
- Ensure the entire pipeline (launch → LLM interaction → validation → reporting) is driven by scripts/CI.
- Sandbox command execution to prevent harmful operations while still allowing the LLM to run necessary tooling.
- Reset state between runs (clean database, queue, filesystem) for reproducibility.

### Reporting & Observability
- Emit per-attempt JSON records and aggregate dashboards (success rate trends, scenario difficulty ranking).
- Surface newly added configs/tests awaiting review.
- Alert on regressions (drop in success or efficiency) to guide prompt/model updates.

