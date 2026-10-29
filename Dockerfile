# ==============================================================================
# ConsentFlow — BSPHO ICF Workbench
# Multi-Stage Production Dockerfile for Google Cloud Run
# ==============================================================================

# Stage 1: Build frontend assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (respecting legacy peer deps)
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Compile optimized static bundle
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production-only dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built distribution files, bundled server, and SQL schema (used by initSchema)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src/db/schema.sql ./schema.sql

# Cloud Run defaults to container port 8080
EXPOSE 8080

CMD ["node", "server.js"]

