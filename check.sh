#!/bin/bash
set -e

echo "=== Running Prettier (fixing issues) ==="
pnpm format

echo "=== Running ESLint ==="
pnpm lint

echo "=== Checking TypeScript compilation (no emit) ==="
pnpm typecheck

echo "=== Running Gitleaks (including git) ==="
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source . --verbose --no-banner
else
  echo "Warning: gitleaks not found in PATH. Install it or add to PATH."
  exit 1
fi

echo "=== Running Tests ==="
pnpm test

echo "=== All checks passed ==="

