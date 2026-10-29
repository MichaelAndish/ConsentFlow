# ConsentFlow — BSPHO ICF Workbench
# Automated Makefile for local development and build management

SHELL := /bin/bash
PORT ?= 1110
.DEFAULT_GOAL := help

.PHONY: all help setup run dev install env build preview lint test check clean auth deploy seed live compose-up compose-down compose-logs

## Display available targets
help:
	@echo "======================================================================"
	@echo "  ConsentFlow — BSPHO ICF Workbench Makefile"
	@echo "======================================================================"
	@echo "  make live        - ONE-COMMAND: Authenticate, deploy to Cloud Run & seed data"
	@echo "  make setup       - Initialize .env and install all dependencies"
	@echo "  make run         - Run app locally on port $(PORT) (runs setup if needed)"
	@echo "  make dev         - Alias for 'make run'"
	@echo "  make compose-up  - Start full local stack (PostgreSQL + App) with Docker Compose"
	@echo "  make compose-down- Stop Docker Compose services"
	@echo "  make seed        - Run idempotent database seeder (zero duplicates)"
	@echo "  make auth        - Authenticate to Google Cloud with .env settings"
	@echo "  make deploy      - Build, upload, and deploy project to Cloud Run"
	@echo "  make install     - Install npm dependencies"
	@echo "  make env         - Create .env from .env.example if missing"
	@echo "  make test        - Execute unit test suite"
	@echo "  make lint        - Run TypeScript static type check"
	@echo "  make check       - Run both linter and tests"
	@echo "  make build       - Compile production build in dist/"
	@echo "  make preview     - Preview production build locally"
	@echo "  make clean       - Clean build artifacts and dist/ directory"
	@echo "======================================================================"

## Set up environment and install all dependencies
setup: env install
	@echo "[OK] Setup completed successfully."

## Ensure .env file exists
env:
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		echo ".env created. Add your GEMINI_API_KEY to enable Google GenAI services."; \
	else \
		echo ".env already exists."; \
	fi

## Install dependencies
install:
	@if [ ! -d "node_modules" ]; then \
		echo "Installing dependencies..."; \
		npm install --legacy-peer-deps; \
	else \
		echo "Dependencies already installed in node_modules."; \
	fi

## Run the application locally with Docker Compose (PostgreSQL + App) and automatically seed data
run: env
	@echo "======================================================================"
	@echo "  Starting ConsentFlow via Docker Compose (PostgreSQL + App)"
	@echo "======================================================================"
	@docker-compose up -d --build
	@echo "[*] Waiting for PostgreSQL and App container to be ready..."
	@until docker-compose exec -T db pg_isready -U consentflow -d consentflow_db >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "[*] Running database seeder (ensuring all clinical trial data is present)..."
	@DATABASE_URL="postgresql://consentflow:consentflow_secret@localhost:5432/consentflow_db" bash tools/seed_db.sh
	@echo "======================================================================"
	@echo "  ConsentFlow is running locally on: http://localhost:$(PORT)"
	@echo "  PostgreSQL database running on   : localhost:5432"
	@echo "  All 3 Multicentric Clinical Studies and 36 Documents Seeded!"
	@echo "======================================================================"
	@docker-compose logs -f app

## Run in lightweight Vite development mode
dev: setup
	@echo "======================================================================"
	@echo " Starting ConsentFlow — BSPHO ICF Workbench on http://localhost:$(PORT)"
	@PORT=$(PORT) npm run dev

## Run TypeScript linting
lint:
	npm run lint

## Run unit tests
test:
	npm test

## Run full validation checks
check: lint test

## Build production bundle
build:
	npm run build

## Preview production build
preview:
	npm run preview

## Clean build artifacts
clean:
	npm run clean
	rm -rf .vite

## Authenticate to Google Cloud using .env parameters
auth:
	@bash tools/auth_gcp.sh

## Build, upload, and deploy to Google Cloud Run
deploy:
	@bash tools/deploy_cloud_run.sh

## Run idempotent database seeder
seed:
	@bash tools/seed_db.sh

## ONE-COMMAND: Authenticate, deploy to Cloud Run & seed live data
live: auth deploy seed
	@echo "[OK] Live Cloud Run deployment & data verification completed."

## Start local stack (PostgreSQL + App) with Docker Compose
compose-up:
	@docker-compose up -d --build
	@echo "Services started. PostgreSQL on port 5432, App on http://localhost:1110"

## Stop Docker Compose services
compose-down:
	@docker-compose down

## Follow Docker Compose logs
compose-logs:
	@docker-compose logs -f
