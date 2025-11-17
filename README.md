# Hands-on Configuration Tools by LLM

## ToDo

- new node types
- saving state of nodes
- run nodes in case of errors
- config examples to plugin, check they pass validation
- path in filter, if, set
- meta about scalar type
- validation of paths against metadata of value including external entities
- returned values of nodes defined
- input data for nodes defined
- output of one node validated against input of another node
- links to entities validated against external meta so ids are valid types
- proper scalar types for if, filter, no string intermediary (postponed)
- passing to resolver field that we are interested in so it doest gather full object
- special nodes to work with repository
- cache for resolver inside single node execution
- what if workflow has several start nodes?
- set looks too complicated
- "(resultField as { value: unknown }).value" why do we need assert?
- if we are going to use toTypedFieldInput for test files lets use similar in expectations
- input: Record<string, unknown>[][] => TypedField[][] - is there a logical problem? we are mapping objects to individual values
- 2 spaces
- walidate all nodes reacheble and only one start node present
- what happens if node passes data to another one and that another also have initial data?

## Project Overview

This project aims to make LLMs configure tools using sophisticated logic and strict configuration formats. The first iteration implements a simple n8n-like engine as an example tool that will be configured by LLM.

## Tech Stack

- TypeScript
- pnpm
- Vitest
- tsx
- ESLint
- Prettier
- Gitleaks

## Prerequisites

- Node.js >= 20.0.0
- pnpm (install with: `npm install -g pnpm`)
- gitleaks (install with: `brew install gitleaks` on macOS, or download from [gitleaks releases](https://github.com/gitleaks/gitleaks/releases))

## Installation

```bash
pnpm install
```

## Scripts

- `./check.sh` - Runs formatting (fixing issues), lint check, build check (without emitting), gitleaks check (including git), and tests
- `./health.sh` - Checks for outdated dependencies and vulnerabilities. Fails if any are found
- `./all-checks.sh` - Runs both check.sh and health.sh
- `pnpm mcp:run` - Starts the local Model Context Protocol (MCP) server

## Development

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck
```

## MCP Server

The repository ships with an MCP server (`mcp/server.ts`) that exposes the currently registered workflow nodes (via `WorkflowEngine`) to compatible MCP clients. This allows you to introspect the available node plugins without touching the workflow-engine internals.

### Running the MCP Server

```bash
# From the project root
pnpm mcp:run
```

The server uses the stdio transport, so it is meant to be launched as a child process by MCP-aware tools.

### Testing with MCP Inspector

1. Install (or run via `npx`) the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).
2. Start the inspector and point it to the server command, for example:

   ```bash
   npx @modelcontextprotocol/inspector -- pnpm --silent mcp:run
   ```

3. Once connected, call the `list-available-nodes` tool inside the inspector to view every node plugin that the engine currently exposes.

## Project Structure

```
.
├── src/           # Source code
├── tests/         # Test files
├── scripts/       # Utility scripts
└── dist/          # Build output (generated)
```
