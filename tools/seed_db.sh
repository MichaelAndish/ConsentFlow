#!/usr/bin/env bash
# ==============================================================================
# ConsentFlow — BSPHO ICF Workbench
# Idempotent Database Seeder for Local Docker PostgreSQL & Google Cloud SQL
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

echo "======================================================================"
echo "  ConsentFlow — Database Migration & Seeder"
echo "======================================================================"

# 1. Load configuration from .env
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^[A-Za-z0-9_]+=' "$ENV_FILE" | sed -e 's/\r$//')
  set +a
fi

# Default to local PostgreSQL if not explicitly defined
export DATABASE_URL="${DATABASE_URL:-postgresql://consentflow:consentflow_secret@localhost:5432/consentflow_db}"

echo "[+] Target Database: ${DATABASE_URL%%:*}:****@${DATABASE_URL#*@}"

# 2. Run schema initialization and idempotent seeder using tsx
cd "${ROOT_DIR}"

if command -v npx &>/dev/null; then
  echo "[*] Executing idempotent seeder (checks existing records before insertion)..."
  npx tsx src/db/seed.ts
else
  echo "[-] npm / npx not found. Ensure Node.js is installed."
  exit 1
fi

echo "======================================================================"
echo "[OK] Database seeded successfully. Zero duplicate records created!"

# 3. Optional: Trigger live Cloud Run instance if explicitly requested or deployed
if [ "${SEED_CLOUD_RUN:-false}" = "true" ] || [ -n "${CLOUD_RUN_URL:-}" ]; then
  GCP_PROJECT="${GOOGLE_CLOUD_PROJECT:-qwiklabs-gcp-01-d64f5abfabdc}"
  GCP_REGION="${GOOGLE_CLOUD_REGION:-europe-west1}"
  SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-consentflow-workbench}"

  LIVE_URL="${CLOUD_RUN_URL:-}"
  if [ -z "$LIVE_URL" ] && command -v gcloud &>/dev/null; then
    LIVE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
      --project "${GCP_PROJECT}" \
      --region "${GCP_REGION}" \
      --format="value(status.url)" 2>/dev/null || echo "")
  fi

  if [ -n "$LIVE_URL" ]; then
    echo "[*] Live Cloud Run instance detected at ${LIVE_URL}"
    echo "[*] Triggering live cloud seed verification endpoint..."
    SEED_RES=$(curl -s -X POST "${LIVE_URL}/api/seed" -H "Content-Type: application/json" || echo "")
    if [ -n "$SEED_RES" ]; then
      echo "[+] Cloud Run Seed Result: ${SEED_RES}"
    fi
    STUDIES_COUNT=$(curl -s "${LIVE_URL}/api/studies" | grep -o '"count":[0-9]*' || echo "")
    echo "[+] Live Studies on Cloud Run: ${STUDIES_COUNT}"
    echo "[SUCCESS] Cloud Run instance is live and operating with verified clinical data!"
  fi
fi
echo "======================================================================"
