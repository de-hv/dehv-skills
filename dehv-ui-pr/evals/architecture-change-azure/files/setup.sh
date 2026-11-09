#!/usr/bin/env bash
# Builds <target>/orders-portal on feat/ORD-7/shared-api-client with committed architecture
# changes (per-feature GraphQL clients -> one shared REST client, new Module Federation remote),
# an Azure DevOps PR template, and an Azure DevOps origin; a pre-push hook blocks pushes and writes <target>/push-attempted.
set -eu
T="$(cd "${1:-.}" && pwd)"; R="$T/orders-portal"
git init -q --bare "$T/remote.git"
mkdir -p "$R" && cd "$R"
git init -q -b main
git config user.name "Test Dev"; git config user.email "dev@example.test"
mkdir -p .azuredevops src/features/orders/api src/features/customers/api src/features/orders/ui src/features/customers/ui
cat > .azuredevops/pull_request_template.md <<'M'
## Description
<!-- What does this PR change and why? -->

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / architecture

## Testing
<!-- How was this tested? -->

## Checklist
- [ ] Unit tests added or updated
- [ ] Tests pass locally
- [ ] Screenshots or diagrams added for UI/architecture changes
M
cat > package.json <<'J'
{ "name": "orders-portal", "private": true, "scripts": { "dev": "webpack serve", "test": "jest" } }
J
cat > webpack.config.js <<'W'
module.exports = { entry: './src/index.js', devServer: { port: 3000 } };
W
cat > src/features/orders/api/ordersClient.js <<'F'
import { GraphQLClient } from 'graphql-request';
const client = new GraphQLClient('/graphql');
export const getOrders = () => client.request(`{ orders { id total status } }`);
F
cat > src/features/customers/api/customersClient.js <<'F'
import { GraphQLClient } from 'graphql-request';
const client = new GraphQLClient('/graphql');
export const getCustomers = () => client.request(`{ customers { id name } }`);
F
cat > src/features/orders/ui/OrdersTable.js <<'F'
import { getOrders } from '../api/ordersClient';
export async function OrdersTable() { const { orders } = await getOrders(); return orders; }
F
cat > src/features/customers/ui/CustomersList.js <<'F'
import { getCustomers } from '../api/customersClient';
export async function CustomersList() { const { customers } = await getCustomers(); return customers; }
F
cat > src/index.js <<'F'
import { OrdersTable } from './features/orders/ui/OrdersTable';
import { CustomersList } from './features/customers/ui/CustomersList';
OrdersTable(); CustomersList();
F
git add -A && git commit -qm "ORD-1 Orders portal skeleton"
git switch -q -c develop && git push -q "$T/remote.git" main develop
git switch -q -c feat/ORD-7/shared-api-client
mkdir -p src/shared/api
git rm -q src/features/orders/api/ordersClient.js src/features/customers/api/customersClient.js
cat > src/shared/api/httpClient.js <<'F'
const BASE = '/api/v1';
export async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}
F
cat > src/shared/api/orders.js <<'F'
import { get } from './httpClient';
export const getOrders = () => get('/orders');
F
cat > src/shared/api/customers.js <<'F'
import { get } from './httpClient';
export const getCustomers = () => get('/customers');
F
cat > src/shared/api/index.js <<'F'
export * from './orders';
export * from './customers';
F
sed -i.bak "s#'../api/ordersClient'#'../../../shared/api'#; s#const { orders } = await getOrders(); return orders;#return getOrders();#" src/features/orders/ui/OrdersTable.js
sed -i.bak "s#'../api/customersClient'#'../../../shared/api'#; s#const { customers } = await getCustomers(); return customers;#return getCustomers();#" src/features/customers/ui/CustomersList.js
rm -f src/features/*/ui/*.bak
cat > webpack.config.js <<'W'
const { ModuleFederationPlugin } = require('webpack').container;
module.exports = {
  entry: './src/index.js',
  devServer: { port: 3000 },
  plugins: [
    new ModuleFederationPlugin({
      name: 'ordersPortal',
      filename: 'remoteEntry.js',
      exposes: { './api': './src/shared/api/index.js', './OrdersTable': './src/features/orders/ui/OrdersTable.js' },
    }),
  ],
};
W
git add -A && git commit -qm "ORD-7 Move feature GraphQL clients to a shared REST client"
cat > src/shared/api/httpClient.test.js <<'F'
import { get } from './httpClient';
test('throws on non-ok responses', async () => {
  global.fetch = async () => ({ ok: false, status: 500 });
  await expect(get('/orders')).rejects.toThrow('GET /orders failed: 500');
});
F
git add -A && git commit -qm "ORD-7 Test shared http client errors; expose api via Module Federation"
git remote add origin https://dev.azure.com/acme-demo/Orders/_git/orders-portal
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
