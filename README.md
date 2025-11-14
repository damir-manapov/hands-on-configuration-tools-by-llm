# Hands-on Configuration Tools by LLM

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

## Project Structure

```
.
├── src/           # Source code
├── tests/         # Test files
├── scripts/       # Utility scripts
└── dist/          # Build output (generated)
```
