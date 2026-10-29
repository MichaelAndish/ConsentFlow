#!/usr/bin/env bash
# ==============================================================================
# ConsentFlow — BSPHO ICF Workbench
# Automated Google Cloud Run Deployment Script
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

echo "======================================================================"
echo "  ConsentFlow — Deploy to Google Cloud Run"
echo "======================================================================"

# 1. Load configuration from .env
if [ ! -f "$ENV_FILE" ]; then
  echo "[-] .env file not found at ${ENV_FILE}"
  echo "    Creating .env from .env.example..."
  cp "${ROOT_DIR}/.env.example" "$ENV_FILE"
fi

# Load variables safely from .env
set -a
# shellcheck disable=SC1090
source <(grep -E '^[A-Za-z0-9_]+=' "$ENV_FILE" | sed -e 's/\r$//')
set +a

# Configuration parameters
GCP_PROJECT="${GOOGLE_CLOUD_PROJECT:-qwiklabs-gcp-01-d64f5abfabdc}"
GCP_REGION="${GOOGLE_CLOUD_REGION:-europe-west1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-consentflow-workbench}"
GCS_BUCKET="${GCS_DEFAULT_BUCKET:-use-cases-qwiklabs-gcp-01-d64f5abfabdc}"
GCS_URI="${GCS_BUCKET_URI:-gs://${GCS_BUCKET}/}"
AI_MODEL="${GEMINI_MODEL:-gemini-3.8-flash}"
API_KEY="${GEMINI_API_KEY:-}"

echo "[+] Target Project   : ${GCP_PROJECT}"
echo "[+] Target Region    : ${GCP_REGION}"
echo "[+] Cloud Run Service: ${SERVICE_NAME}"
echo "[+] Connected Bucket : ${GCS_URI}"
echo "[+] AI Model         : ${AI_MODEL}"
echo "----------------------------------------------------------------------"

# 2. Authenticate and verify gcloud credentials
echo "[*] Step 1/4: Verifying GCP credentials and project authorization..."
bash "${SCRIPT_DIR}/auth_gcp.sh"

# 3. Enable necessary Google Cloud APIs
echo "[*] Step 2/4: Ensuring required Google Cloud APIs are enabled..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  --project="${GCP_PROJECT}" || {
    echo "[!] Warning: Could not enable APIs automatically. Continuing if already enabled..."
  }

# 4. Prepare Cloud Run Environment Variables
echo "[*] Step 3/4: Preparing production container environment variables..."
ENV_VARS="NODE_ENV=production"
ENV_VARS="${ENV_VARS},GOOGLE_CLOUD_PROJECT=${GCP_PROJECT}"
ENV_VARS="${ENV_VARS},GOOGLE_CLOUD_REGION=${GCP_REGION}"
ENV_VARS="${ENV_VARS},GCS_DEFAULT_BUCKET=${GCS_BUCKET}"
ENV_VARS="${ENV_VARS},GCS_BUCKET_NAME=${GCS_BUCKET}"
ENV_VARS="${ENV_VARS},GCS_BUCKET_URI=${GCS_URI}"
ENV_VARS="${ENV_VARS},GEMINI_MODEL=${AI_MODEL}"

if [ -n "$API_KEY" ]; then
  ENV_VARS="${ENV_VARS},GEMINI_API_KEY=${API_KEY}"
  echo "[+] Injected GEMINI_API_KEY into Cloud Run runtime configuration (server-only)."
else
  echo "[!] Notice: GEMINI_API_KEY is empty. Cloud Run will operate in deterministic fallback mode."
fi

SEED_SECRET_VALUE="${SEED_SECRET:-}"
if [ -n "$SEED_SECRET_VALUE" ]; then
  ENV_VARS="${ENV_VARS},SEED_SECRET=${SEED_SECRET_VALUE}"
  echo "[+] Injected SEED_SECRET — POST /api/seed requires X-Seed-Token."
fi

# 5. Deploy to Cloud Run using source-to-image Cloud Build
echo "[*] Step 4/4: Building container and deploying to Cloud Run..."
cd "${ROOT_DIR}"

ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
ACTIVE_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
SPECIFIED_ACCOUNT="${GOOGLE_CLOUD_ACCOUNT:-${ACCOUNT:-}}"

if [ -n "$SPECIFIED_ACCOUNT" ] && [ "$ACTIVE_ACCOUNT" != "$SPECIFIED_ACCOUNT" ]; then
  echo "[-] SECURITY STOP: Active gcloud account (${ACTIVE_ACCOUNT}) does not match configured account (${SPECIFIED_ACCOUNT}) in .env!"
  echo "    Deployment aborted to prevent pushing to personal or company accounts."
  exit 1
fi

if [ "$ACTIVE_PROJECT" != "$GCP_PROJECT" ]; then
  echo "[-] SECURITY STOP: Active gcloud project (${ACTIVE_PROJECT}) does not match target project (${GCP_PROJECT})!"
  echo "    Deployment aborted to prevent deployment to the wrong environment."
  exit 1
fi

echo "[OK] Security verification passed: Account '${ACTIVE_ACCOUNT}' targeting project '${ACTIVE_PROJECT}'."

GCLOUD_ACCOUNT_ARG=()
if [ -n "${SPECIFIED_ACCOUNT}" ]; then
  GCLOUD_ACCOUNT_ARG=("--account=${SPECIFIED_ACCOUNT}")
fi

gcloud run deploy "${SERVICE_NAME}" \
  "${GCLOUD_ACCOUNT_ARG[@]}" \
  --source . \
  --project "${GCP_PROJECT}" \
  --region "${GCP_REGION}" \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "${ENV_VARS}"

# 6. Retrieve and display service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --project "${GCP_PROJECT}" \
  --region "${GCP_REGION}" \
  --format="value(status.url)" 2>/dev/null || echo "")

# 7. Trigger live cloud database seeder verification
if [ -n "$SERVICE_URL" ]; then
  echo "[*] Verifying & seeding live Cloud Run instance..."
  SEED_HEADERS=(-H "Content-Type: application/json")
  if [ -n "${SEED_SECRET:-}" ]; then
    SEED_HEADERS+=(-H "X-Seed-Token: ${SEED_SECRET}")
  fi
  SEED_RES=$(curl -s -X POST "${SERVICE_URL}/api/seed" "${SEED_HEADERS[@]}" || echo "")
  if [ -n "$SEED_RES" ]; then
    echo "[+] Live Seed Verification: ${SEED_RES}"
  fi
fi

echo "======================================================================"
if [ -n "$SERVICE_URL" ]; then
  echo " [SUCCESS] ConsentFlow is LIVE on Google Cloud Run with actual data!"
  echo " URL: ${SERVICE_URL}"
  echo " Region: ${GCP_REGION} (Brussels, Belgium)"
  echo " Project: ${GCP_PROJECT}"
else
  echo " [OK] Deployment command completed. Check Cloud Console for service status."
fi
echo "======================================================================"

