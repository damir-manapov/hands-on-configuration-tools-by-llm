#!/bin/bash
set -e

echo "=== Checking for outdated dependencies ==="
OUTDATED_OUTPUT=$(pnpm outdated 2>&1 || true)
if echo "$OUTDATED_OUTPUT" | grep -qE "Package|Wanted|Latest"; then
  OUTDATED_COUNT=$(echo "$OUTDATED_OUTPUT" | grep -cE "^[a-zA-Z@]" || echo "0")
  # Remove any newlines and ensure it's a number
  OUTDATED_COUNT=$(echo "$OUTDATED_COUNT" | tr -d '\n' | head -1)
  if [ -n "$OUTDATED_COUNT" ] && [ "$OUTDATED_COUNT" -gt 0 ] 2>/dev/null; then
    echo "Error: Outdated dependencies found:"
    echo "$OUTDATED_OUTPUT"
    exit 1
  fi
fi

echo "=== Checking for vulnerabilities ==="
AUDIT_OUTPUT=$(pnpm audit --json 2>/dev/null || echo '{}')
if echo "$AUDIT_OUTPUT" | grep -q '"vulnerabilities"'; then
  VULN_COUNT=$(echo "$AUDIT_OUTPUT" | grep -o '"vulnerabilities":[0-9]*' | grep -o '[0-9]*' | head -1)
  if [ -n "$VULN_COUNT" ] && [ "$VULN_COUNT" != "0" ]; then
    echo "Error: Vulnerabilities found:"
    pnpm audit
    exit 1
  fi
fi

echo "=== All health checks passed ==="

