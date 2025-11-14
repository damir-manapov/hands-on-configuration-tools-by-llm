#!/bin/bash
set -e

echo "=== Running all checks ==="
./check.sh
./health.sh

echo "=== All checks completed successfully ==="

