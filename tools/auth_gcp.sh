#!/usr/bin/env bash
# ==============================================================================
# ConsentFlow — BSPHO ICF Workbench
# GCP Multi-Account Authentication & Project Configuration Script
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

echo "======================================================================"
# ConsentFlow — Google Cloud Authentication Setup
echo "  ConsentFlow — Google Cloud Authentication Setup (Multi-Account)"
echo "======================================================================"

# 1. Verify and load .env configuration
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

# Extract key configuration
GCP_PROJECT="${GOOGLE_CLOUD_PROJECT:-qwiklabs-gcp-01-d64f5abfabdc}"
GCP_REGION="${GOOGLE_CLOUD_REGION:-europe-west1}"
SPECIFIED_ACCOUNT="${GOOGLE_CLOUD_ACCOUNT:-${ACCOUNT:-}}"

echo "[+] Configured GCP Target Project: ${GCP_PROJECT}"
echo "[+] Configured GCP Target Region : ${GCP_REGION}"
if [ -n "$SPECIFIED_ACCOUNT" ]; then
  echo "[+] Target Account (from .env)   : ${SPECIFIED_ACCOUNT}"
fi
echo "----------------------------------------------------------------------"

# 2. Check if gcloud CLI is available
if ! command -v gcloud &> /dev/null; then
  echo "[-] ERROR: 'gcloud' CLI is not installed or not in PATH."
  echo "    Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# 3. Multi-account handling
echo "[*] Currently credentialed accounts on this machine:"
gcloud auth list 2>/dev/null || true
echo "----------------------------------------------------------------------"

if [ -z "$SPECIFIED_ACCOUNT" ]; then
  echo "[-] SAFETY STOP: GOOGLE_CLOUD_ACCOUNT is empty in .env!"
  echo "    To guarantee you NEVER push or authenticate with a personal or company account,"
  echo "    you must set GOOGLE_CLOUD_ACCOUNT in .env to your designated GCP account email."
  echo "    Example in .env:"
  echo "      GOOGLE_CLOUD_ACCOUNT=\"student-01-xxxx@qwiklabs.net\""
  echo "----------------------------------------------------------------------"
  exit 1
fi

echo "[+] Enforcing target account: ${SPECIFIED_ACCOUNT}..."
gcloud config set account "${SPECIFIED_ACCOUNT}" 2>/dev/null || true

# Check if credentials for this account are active and valid
if ! gcloud projects list --account="${SPECIFIED_ACCOUNT}" --limit=1 &>/dev/null; then
  echo "[!] Account '${SPECIFIED_ACCOUNT}' requires authentication or session refresh."
  echo "[*] Launching browser login for '${SPECIFIED_ACCOUNT}'..."
  gcloud auth login "${SPECIFIED_ACCOUNT}" --update-adc
else
  echo "[OK] Account '${SPECIFIED_ACCOUNT}' is authenticated and active."
fi
CURRENT_ACCOUNT="${SPECIFIED_ACCOUNT}"

# 4. Set target GCP Project and Region
echo "[+] Binding active gcloud project to '${GCP_PROJECT}'..."
gcloud config set project "${GCP_PROJECT}"

echo "[+] Setting default Cloud Run region to '${GCP_REGION}'..."
gcloud config set run/region "${GCP_REGION}"

# 5. Verify access to target GCP Project
echo "[+] Verifying project accessibility..."
if gcloud projects describe "${GCP_PROJECT}" --format="value(projectNumber)" &>/dev/null; then
  PROJECT_NUMBER=$(gcloud projects describe "${GCP_PROJECT}" --format="value(projectNumber)")
  echo "[OK] Successfully connected to project: ${GCP_PROJECT} (Project #: ${PROJECT_NUMBER})"
  echo "[OK] Authenticated user: ${CURRENT_ACCOUNT}"
else
  echo "[!] Notice: Account '${CURRENT_ACCOUNT}' could not describe '${GCP_PROJECT}'."
  echo "    If you have multiple Google accounts, please ensure you use the account"
  echo "    associated with this Qwiklabs lab."
  echo "    Tip: Set GOOGLE_CLOUD_ACCOUNT=\"<your-lab-email>\" in .env or run:"
  echo "         ACCOUNT=<your-lab-email> make auth"
fi

echo "======================================================================"
echo "[OK] GCP Authentication and configuration completed successfully!"
echo "======================================================================"
