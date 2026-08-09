#!/usr/bin/env bash
# Rebrands this starter kit for a new project by replacing every
# leftover placeholder identifier (docker/db names, package.json name,
# and old Content Owl / Nest Stay copy-paste remnants) with the given
# project name.
set -euo pipefail

NAME="${1:-}"

if [ -z "$NAME" ]; then
  echo "Usage: $0 <project-name>" >&2
  echo "  <project-name> must be lowercase kebab-case, e.g. 'timer' or 'my-app'" >&2
  exit 1
fi

if ! [[ "$NAME" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: project name must be lowercase kebab-case (letters, numbers, hyphens), e.g. 'timer' or 'my-app'" >&2
  exit 1
fi

TITLE=$(echo "$NAME" | sed -E 's/(^|-)([a-z])/\1\U\2/g; s/-/ /g')

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "Renaming project to '$NAME' (title: '$TITLE')..."

replace() {
  local pattern="$1"
  shift
  for f in "$@"; do
    sed -i.bak "$pattern" "$f"
    rm -f "$f.bak"
  done
}

# --- kebab-case slug replacements ---
replace "s/nestjs-sk/${NAME}/g" docker-compose.yml Makefile .env.example
replace "s/content-owl:/${NAME}:/g" .env.example src/config/redis.config.ts src/config/validation.schema.ts
replace "s/project-name/${NAME}/g" package.json package-lock.json

# --- Title Case human-name replacements ---
replace "s/Content Owl/${TITLE}/g" src/main.ts
replace "s/Nest Stay/${TITLE}/g" docs/architecture/index.md
replace "1s/.*/# ${TITLE}/" README.md

echo "Done. Review the changes with 'git diff' before committing."
