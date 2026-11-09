#!/usr/bin/env bash
# Builds <target>/billing-ui on fix/BILL-9/date-filter-off-by-one with an uncommitted logic fix
# and its test (no UI change, no PR template) and a GitLab origin; a pre-push hook blocks pushes and writes <target>/push-attempted.
set -eu
T="$(cd "${1:-.}" && pwd)"; R="$T/billing-ui"
git init -q --bare "$T/remote.git"
mkdir -p "$R/src/utils" && cd "$R"
git init -q -b main
git config user.name "Test Dev"; git config user.email "dev@example.test"
cat > package.json <<'J'
{ "name": "billing-ui", "private": true, "type": "module", "scripts": { "test": "node --test" } }
J
cat > src/utils/dateRange.js <<'F'
// Returns the [start, end) range in ms for an inclusive "from"/"to" date filter (YYYY-MM-DD, UTC).
export function toRange(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return [start, end];
}
F
git add -A && git commit -qm "BILL-2: Add date range util"
git switch -q -c develop && git push -q "$T/remote.git" main develop
git switch -q -c fix/BILL-9/date-filter-off-by-one
cat > src/utils/dateRange.js <<'F'
const DAY_MS = 24 * 60 * 60 * 1000;

// Returns the [start, end) range in ms for an inclusive "from"/"to" date filter (YYYY-MM-DD, UTC).
// The end is exclusive, so it is the start of the day after "to"; otherwise invoices dated on
// the "to" day were dropped.
export function toRange(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`) + DAY_MS;
  return [start, end];
}
F
cat > src/utils/dateRange.test.js <<'F'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toRange } from './dateRange.js';

test('includes the whole "to" day', () => {
  const [start, end] = toRange('2026-01-01', '2026-01-31');
  assert.equal(start, Date.parse('2026-01-01T00:00:00Z'));
  assert.equal(end, Date.parse('2026-02-01T00:00:00Z'));
});
F
git remote add origin https://gitlab.com/acme-demo/billing-ui.git
mkdir -p .git/hooks
cat > .git/hooks/pre-push <<HOOK
#!/bin/sh
# Test fixture: records the push attempt and blocks it, so nothing leaves the machine.
date > "$T/push-attempted"
echo "push blocked in this environment" >&2
exit 1
HOOK
chmod +x .git/hooks/pre-push
git fetch -q "$T/remote.git" '+refs/heads/*:refs/remotes/origin/*'
git symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/main
echo "ready: $R (on $(git branch --show-current))"
