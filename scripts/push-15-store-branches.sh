#!/usr/bin/env bash
# scripts/push-15-store-branches.sh — Phase 7 Git push
#
# Pushes each compiled Shopify theme to its own ROOT-LEVEL GitHub branch
# (store-01-bizi-bees ... store-15-verde-hydro) and the Dropper OS app + 7
# Super-Bots to main.
#
# Requires: a git remote named `origin` and push credentials (GH_TOKEN or gh CLI).
# Usage: REMOTE_URL=https://x-access-token:$GH_TOKEN@github.com/OWNER/REPO.git bash scripts/push-15-store-branches.sh
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE_URL="${REMOTE_URL:-$(git remote get-url origin 2>/dev/null || true)}"
if [ -z "$REMOTE_URL" ]; then
  echo "No git remote 'origin'. Set REMOTE_URL=... or add a remote first." >&2
  exit 1
fi
git remote set-url origin "$REMOTE_URL" 2>/dev/null || git remote add origin "$REMOTE_URL"

MAIN_BRANCH="${MAIN_BRANCH:-main}"
WORK="$(mktemp -d)"
echo "[push] worktree: $WORK"

# 1) main: app + bots + scripts + config + content + marketing + reports
git checkout -q -B "$MAIN_BRANCH" 2>/dev/null || true
git add -A
git -c user.name="Dropper OS" -c user.email="dropper-os@abacus.ai" commit -q -m "feat(dropper-os): 7 super-bots, 180 products, 15 themes, growth vault, treasury" || echo "[push] nothing new on $MAIN_BRANCH"
git push -q origin "$MAIN_BRANCH"
echo "[push] main -> origin/$MAIN_BRANCH"

# 2) one orphan branch per store, theme files at the ROOT of the branch
for dir in .build-themes/*/; do
  store="$(basename "$dir")"
  echo "[push] building orphan branch $store"
  rm -rf "$WORK/$store"
  cp -R "$dir" "$WORK/$store"
  (
    cd "$WORK/$store"
    git init -q .
    git checkout -q -b "$store"
    git add -A
    git -c user.name="Dropper OS" -c user.email="dropper-os@abacus.ai" commit -q -m "feat(theme): $store root-valid Shopify OS 2.0 theme"
    git push -q --force "$REMOTE_URL" "$store:$store"
  )
  echo "[push] $store -> origin/$store"
done

rm -rf "$WORK"
echo "[push] done: 15 store branches + $MAIN_BRANCH"
