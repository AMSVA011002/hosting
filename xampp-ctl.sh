#!/usr/bin/env bash
# XPGAMPP Stack CLI Controller (Apache + PHP 8.4, MySQL 9.2, PostgreSQL 17)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

banner() {
  echo -e "${CYAN}================================================================${NC}"
  echo -e "${CYAN}  XPGAMPP v8.4.4 — Apache 2.4 | PHP 8.4 | MySQL 9.2 | PG 17.4  ${NC}"
  echo -e "${CYAN}================================================================${NC}"
}

case "${1:-help}" in
  start)
    banner
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
      echo -e "${GREEN}[+] Starting Docker Compose services (PHP 8.4, MySQL 9.2, PostgreSQL 17)...${NC}"
      docker compose up -d --build
    else
      echo -e "${YELLOW}[i] Starting XPGAMPP Web Control Panel & Embedded Runtime...${NC}"
      npm run start
    fi
    ;;
  stop)
    banner
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
      echo -e "${YELLOW}[-] Stopping XPGAMPP Docker services...${NC}"
      docker compose down
    else
      echo -e "${YELLOW}[-] Stopping local XPGAMPP server processes...${NC}"
      pkill -f "node server/index.js" || true
    fi
    ;;
  restart)
    "$0" stop
    "$0" start
    ;;
  status)
    banner
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
      docker compose ps
    else
      echo -e "${GREEN}Control Panel API:${NC} http://localhost:3000/api/status"
      curl -s http://localhost:3000/api/status || echo "Control Panel is not currently running."
    fi
    ;;
  logs)
    tail -n 50 -f "$ROOT_DIR"/var/log/*.log
    ;;
  *)
    banner
    echo "Usage: ./xampp-ctl.sh {start|stop|restart|status|logs}"
    ;;
esac
