#!/usr/bin/env bash
# Copies the case files into the current folder and builds the test repo there.
set -eu
cp -R "$(dirname "$0")/files/." .
bash ./setup.sh "$PWD"
