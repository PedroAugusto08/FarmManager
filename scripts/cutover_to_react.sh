#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REACT_DIR="$ROOT_DIR/react-ts"
DIST_DIR="$REACT_DIR/dist"
BACKUP_DIR="$ROOT_DIR/legacy-app"

backup_legacy_if_needed() {
  if [[ -d "$BACKUP_DIR" ]]; then
    echo "[cutover] Backup legado ja existe em: $BACKUP_DIR"
    return
  fi

  echo "[cutover] Criando backup do legado em: $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"

  [[ -f "$ROOT_DIR/index.html" ]] && cp -a "$ROOT_DIR/index.html" "$BACKUP_DIR/index.html"
  [[ -f "$ROOT_DIR/manifest.webmanifest" ]] && cp -a "$ROOT_DIR/manifest.webmanifest" "$BACKUP_DIR/manifest.webmanifest"
  [[ -f "$ROOT_DIR/sw.js" ]] && cp -a "$ROOT_DIR/sw.js" "$BACKUP_DIR/sw.js"

  [[ -d "$ROOT_DIR/css" ]] && cp -a "$ROOT_DIR/css" "$BACKUP_DIR/css"
  [[ -d "$ROOT_DIR/js" ]] && cp -a "$ROOT_DIR/js" "$BACKUP_DIR/js"
  [[ -d "$ROOT_DIR/icons" ]] && cp -a "$ROOT_DIR/icons" "$BACKUP_DIR/icons"

  echo "[cutover] Backup do legado concluido."
}

build_react() {
  echo "[cutover] Build do React em $REACT_DIR"
  cd "$REACT_DIR"
  npm run build
}

deploy_dist_to_root() {
  echo "[cutover] Publicando dist do React na raiz: $ROOT_DIR"

  if [[ ! -d "$DIST_DIR" ]]; then
    echo "[cutover] Erro: pasta dist nao encontrada em $DIST_DIR"
    exit 1
  fi

  cp -a "$DIST_DIR/." "$ROOT_DIR/"

  cat > "$ROOT_DIR/.cutover-state" <<EOF
mode=react
updated_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
source=react-ts/dist
EOF

  echo "[cutover] Corte concluido."
  echo "[cutover] Rollback: ./scripts/rollback_to_legacy.sh"
}

main() {
  backup_legacy_if_needed
  build_react
  deploy_dist_to_root
}

main "$@"
