#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/legacy-app"

restore_file() {
  local name="$1"
  if [[ -f "$BACKUP_DIR/$name" ]]; then
    cp -a "$BACKUP_DIR/$name" "$ROOT_DIR/$name"
  fi
}

restore_dir() {
  local name="$1"
  if [[ -d "$BACKUP_DIR/$name" ]]; then
    rm -rf "$ROOT_DIR/$name"
    cp -a "$BACKUP_DIR/$name" "$ROOT_DIR/$name"
  fi
}

remove_react_artifacts() {
  rm -rf "$ROOT_DIR/assets"
  rm -f "$ROOT_DIR/favicon.svg"
  rm -f "$ROOT_DIR/icons.svg"
}

main() {
  if [[ ! -d "$BACKUP_DIR" ]]; then
    echo "[rollback] Backup legado nao encontrado em $BACKUP_DIR"
    echo "[rollback] Execute primeiro: ./scripts/cutover_to_react.sh"
    exit 1
  fi

  echo "[rollback] Restaurando arquivos do legado"

  restore_file "index.html"
  restore_file "manifest.webmanifest"
  restore_file "sw.js"

  restore_dir "css"
  restore_dir "js"
  restore_dir "icons"

  remove_react_artifacts

  cat > "$ROOT_DIR/.cutover-state" <<EOF
mode=legacy
updated_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
source=legacy-app
EOF

  echo "[rollback] Rollback concluido."
}

main "$@"
