#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."
pnpm build > /dev/null 2>&1
exec node dist/mcp/server.js

