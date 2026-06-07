#!/bin/bash
set -euo pipefail

# Kjør kun i Claude Code på web (remote). Lokalt gjør utvikleren dette selv.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Installer avhengigheter (idempotent, drar nytte av container-caching).
npm install
