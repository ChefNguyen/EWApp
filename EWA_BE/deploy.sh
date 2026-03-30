#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh – Run on Oracle VM to pull and restart EWA backend
# Called from Azure Pipelines SSH step, or manually.
#
# Required environment variables (set in .env or exported by the caller):
#   DOCKER_HUB_USERNAME   – Docker Hub username
#   DOCKER_HUB_TOKEN      – Docker Hub access token (read-only)
#   IMAGE_TAG             – Image tag to deploy (e.g. "20240101-abc1234")
#   DEPLOY_DIR            – Absolute path to deployment directory on VM
#
# Usage:
#   export IMAGE_TAG=20240101-abc1234
#   bash /opt/ewa/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

###############################################################################
# Defaults
###############################################################################
DEPLOY_DIR="${DEPLOY_DIR:-/opt/ewa}"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
ENV_FILE="${DEPLOY_DIR}/.env"
IMAGE_TAG="${IMAGE_TAG:-latest}"

###############################################################################
# Helpers
###############################################################################
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

###############################################################################
# Guards
###############################################################################
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Copy .env.example → .env and fill in secrets." >&2
  exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "ERROR: ${COMPOSE_FILE} not found. Upload docker-compose.prod.yml to ${DEPLOY_DIR}." >&2
  exit 1
fi

###############################################################################
# Main deployment
###############################################################################
log "=== EWA Deploy start | tag=${IMAGE_TAG} ==="

# 1. Docker Hub login (credentials come from env, not printed)
log "Logging in to Docker Hub..."
echo "${DOCKER_HUB_TOKEN}" | docker login --username "${DOCKER_HUB_USERNAME}" --password-stdin

# 2. Export IMAGE_TAG so compose picks it up
export IMAGE_TAG

# 3. Pull newest image
log "Pulling image ${DOCKER_HUB_USERNAME}/ewa-backend:${IMAGE_TAG} ..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" pull

# 4. Recreate service with zero-downtime (compose handles container replacement)
log "Restarting ewa-backend service..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --remove-orphans

# 5. Clean up dangling images to save disk
log "Pruning dangling images..."
docker image prune -f

# 6. Show running containers
log "=== Running containers ==="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

log "=== Deploy complete ==="
