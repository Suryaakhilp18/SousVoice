#!/usr/bin/env bash
# Offline, no-network, no-API-key acceptance test for the hard voice claim.
# See RIME_EVIDENCE.md.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m unittest tests.test_interruption -v
