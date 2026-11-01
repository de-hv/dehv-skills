#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
npm install --silent --no-audit --no-fund
