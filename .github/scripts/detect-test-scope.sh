#!/usr/bin/env bash
# Decide which test suites a change needs (used by .github/workflows/test.yml).
#
# usage: detect-test-scope.sh [base-ref]
#   base-ref: ref to diff against (pull requests). Empty -> run everything.
# outputs (GITHUB_OUTPUT, or stdout when run locally): unit / e2e / full = true|false
set -euo pipefail

base="${1:-}"
unit=false
e2e=false
full=false

if [ -z "$base" ]; then
  unit=true e2e=true full=true
else
  while IFS= read -r file; do
    case "$file" in
      # A PR bumps "version" every time (read by app-navbar.tsx): not a dependency / script change
      package.json)
        if git diff -U0 "$base"...HEAD -- package.json | grep -E '^[+-][^+-]' | grep -qv '"version"'; then
          unit=true e2e=true full=true
        else
          unit=true
        fi ;;
      # Anything that changes how tests are built, run or what they resolve: run everything
      bun.lock | vitest.config.ts | vite.config.js | tsconfig*.json | .npmrc | \
        .github/workflows/test.yml | .github/actions/* | .github/scripts/*)
        unit=true e2e=true full=true ;;
      # The app is mounted whole in E2E, so any source / shared test helper can affect both
      src/* | index.html | tests/*.ts)
        unit=true e2e=true ;;
      tests/unit/* | scripts/*)
        unit=true ;;
      tests/e2e/*)
        e2e=true ;;
      # docs, README, public/, Docker files, etc. have no tests
      *) ;;
    esac
  done < <(git diff --name-only "$base"...HEAD)
fi

for key in unit e2e full; do
  echo "$key=${!key}" >> "${GITHUB_OUTPUT:-/dev/stdout}"
done
