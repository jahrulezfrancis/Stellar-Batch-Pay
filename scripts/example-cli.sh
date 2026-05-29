#!/bin/bash
# Example CLI usage script for Stellar BatchPay.
#
# Validates and submits a batch from examples/payments.json on the Stellar
# testnet. Requires STELLAR_SECRET_KEY to be exported in the environment.

set -euo pipefail

if [ -z "${STELLAR_SECRET_KEY:-}" ]; then
  echo "Error: STELLAR_SECRET_KEY environment variable is not set" >&2
  exit 1
fi

echo "=== Stellar Bulk Payment CLI Example ==="
echo

if [ ! -d "node_modules" ]; then
  echo "[*] Installing dependencies..."
  npm install
fi

echo "[*] Validating examples/payments.json..."
node cli/index.mjs validate examples/payments.json

echo
echo "[*] Submitting on testnet..."
node cli/index.mjs submit examples/payments.json \
  --network testnet \
  --output /tmp/stellar-results.json

if [ -f "/tmp/stellar-results.json" ]; then
  echo
  echo "[+] Results saved to /tmp/stellar-results.json"
  echo
  echo "[*] First 20 lines:"
  head -20 /tmp/stellar-results.json
fi
