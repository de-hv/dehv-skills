#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
git init -q
git config user.email eval@example.com
git config user.name eval
git add -A
git commit -qm "Add helpers"
printf 'export const subtract = (a: number, b: number) => a - b\n' >> src/math.ts
git add src/math.ts
printf 'export const lower = (text: string) => text.toLowerCase()\n' >> src/format.ts
printf 'export const version = "1.0.0"\n' > src/version.ts
