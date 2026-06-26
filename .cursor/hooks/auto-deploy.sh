#!/bin/bash
# Auto-commit and push after each agent turn for CI/CD deployment.
# Fires on the `stop` event (agent completed its response).

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_DIR"

# Consume stdin (required by Cursor hooks protocol)
input=$(cat)

# Nothing to do if working tree is clean
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo '{}'
  exit 0
fi

# Stage everything
git add -A

# Build a compact commit message from what changed
CHANGED=$(git diff --cached --name-only | head -10 | tr '\n' ' ' | sed 's/ $//')
FILE_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
TIMESTAMP=$(date '+%H:%M')

if [ "$FILE_COUNT" -eq 1 ]; then
  MSG="auto: update $CHANGED [$TIMESTAMP]"
elif [ "$FILE_COUNT" -le 5 ]; then
  MSG="auto: update $CHANGED [$TIMESTAMP]"
else
  MSG="auto: update $FILE_COUNT files [$TIMESTAMP]"
fi

git commit -m "$MSG" --no-gpg-sign 2>&1 || true

# Push (non-blocking — if push fails, just log it)
git push origin HEAD 2>&1 || echo "Push failed — will retry on next change" >&2

echo '{}'
exit 0
