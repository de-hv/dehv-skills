#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
git init -q
git config user.email eval@example.com
git config user.name eval
git add -A
git commit -qm "Add readme"
mkdir -p src
cat > src/retry.ts <<'EOF'
export async function retry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task()
    } catch (error) {
      if (attempt >= attempts) throw error
    }
  }
}
EOF
