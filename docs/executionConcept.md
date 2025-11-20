## Workflow Execution Concept

### Overview
Our workflow engine treats each workflow definition as immutable configuration and each workflow run as an isolated instance. Instances can start at any time, run concurrently, and are orchestrated through a job queue that allows horizontal scaling across multiple worker processes.

### Definitions, Instances, and Metadata
- **Workflow definition**: JSON/Zod-backed structure describing nodes, their parameters, edges, and metadata (purpose, use cases, output ports). Stored once and versioned.
- **Workflow instance**: Runtime record created whenever a workflow is executed. Contains instance id, pointer to definition version, runtime context (payload, variables, node pointer), audit info (startedBy, timestamps), and status (running, paused, errored, completed).
- **Node metadata**: Declared by each plugin (`nodeType`, `purpose`, `useCases`, `outputPorts`, `parameterSchema`, `parametersExamples`). Metadata is static and used for validation, documentation, and MCP exposure.

### Data vs Configuration
- **Configuration** lives in the definition (node parameters, routing topology). It is immutable during execution.
- **Data** is the payload flowing through nodes. Nodes may enrich, replace, or split data but should never mutate their configuration.
- Each execution step consumes data from upstream nodes and produces new data for downstream nodes. Persisting intermediate data per instance allows resuming after failures.

### Execution Lifecycle
1. **Instance creation**: API/UI request creates a workflow instance and enqueues the Start node job with the initial payload.
2. **Job execution**: Workers dequeue jobs, load the workflow definition and instance state, validate node parameters, execute the node, and persist results.
3. **Routing**: For each outgoing edge, the worker enqueues a new job containing the downstream node id, payload, and instance id.
4. **Completion**: When no more jobs remain for the instance (all branches resolved and joined), the instance is marked completed.
5. **Error handling**: Failures transition the instance to `errored` with context; retry policies can re-enqueue jobs as needed.

### Parallelism and Large Data
- Nodes control how they handle arrays. Options include serial processing, chunked batching, or fan-out (Split nodes) that emit one job per item/chunk.
- The job queue plus worker pool provides concurrency. Adding workers increases throughput while respecting per-node concurrency limits.
- For aggregation, downstream nodes can wait for all upstream branches or use stateful reducers that accumulate partial results keyed by instance and join id.

### Pause and Resilience
- Nodes like Pause compute a resume timestamp, persist instance state (node id, payload, resume time), and do **not** block a worker.
- A scheduler scans persisted pauses and re-enqueues jobs when resume times are reached. On restart, overdue pauses are resumed automatically.
- All long-running operations should be checkpointed (instance state, payload snapshots, pending jobs) in durable storage so restarts or worker crashes do not lose progress.

### Distributed Workers and Load Splitting
- Workers are stateless executors that consume jobs from a shared queue (Redis, Postgres, Kafka, etc.). Each job contains workflow id, instance id, node id, payload reference, and retry metadata.
- Horizontal scale: deploy multiple worker processes/containers. Load is naturally distributed because every job can be picked up by any available worker.
- Optional sharding strategies:
  - **Node-type sharding**: dedicate workers to heavy node types.
  - **Instance affinity**: ensure tasks from the same instance prefer the same worker to optimize cache locality (not required).
- Workers should heartbeat/ack jobs to avoid duplicates; unacked jobs return to the queue after a visibility timeout.

### Persistence Requirements
- **Definition store**: versioned definitions accessible to all workers.
- **Instance store**: tracks status, current node pointer(s), payload references, pause schedules, audit info.
- **Payload store**: large data blobs referenced by jobs to avoid oversized queue messages.
- **Job queue**: durable message bus enabling retries and ordering guarantees per instance branch.

### API Surface
- `startWorkflow(definitionId, inputPayload)` → returns instance id.
- `getInstanceStatus(instanceId)` → running/paused/errored/completed plus metadata.
- `pause/resume` endpoints for manual controls (in addition to automatic Pause node behavior).
- Metrics/observability endpoints for active jobs, worker health, and backlog.

This conceptual model guarantees that multiple workflow instances can run concurrently, large datasets can be processed via splitting and parallelism, pauses survive restarts, and load can be spread across any number of worker nodes.

