#!/usr/bin/env node
// Uploads files as attachments of an Azure DevOps pull request and prints "<file>\t<url>" per file.
// Usage: node azure-attach.mjs <org-url> <project> <repo> <pr-id> <file>...
// Auth: AZURE_DEVOPS_EXT_PAT (basic auth) if set, otherwise an Entra token from `az account get-access-token`.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const [orgUrl, project, repo, prId, ...files] = process.argv.slice(2);
if (!orgUrl || !project || !repo || !prId || files.length === 0) {
  console.error('usage: node azure-attach.mjs <org-url> <project> <repo> <pr-id> <file>...');
  process.exit(1);
}

function authHeader() {
  const pat = process.env.AZURE_DEVOPS_EXT_PAT;
  if (pat) return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
  const token = execFileSync('az', [
    'account', 'get-access-token',
    '--resource', '499b84ac-1321-427f-aa17-267ca6975798',
    '--query', 'accessToken', '-o', 'tsv',
  ], { encoding: 'utf8', shell: process.platform === 'win32' }).trim();
  if (!token) throw new Error('No token from `az account get-access-token`. Run `az login` first.');
  return `Bearer ${token}`;
}

const auth = authHeader();
const base = `${orgUrl.replace(/\/$/, '')}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repo)}/pullRequests/${prId}/attachments`;
let failed = 0;

for (const file of files) {
  const name = path.basename(file);
  const url = `${base}/${encodeURIComponent(name)}?api-version=7.1-preview.1`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/octet-stream' },
      body: readFileSync(file),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    const json = JSON.parse(text);
    if (!json.url) throw new Error(`No url in response: ${text.slice(0, 300)}`);
    process.stdout.write(`${name}\t${json.url}\n`);
  } catch (err) {
    failed += 1;
    console.error(`${name}\tERROR\t${err.message}`);
  }
}
process.exit(failed ? 2 : 0);
