# Stage 1: Build
FROM node:20-alpine

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json ./
COPY pnpm-lock.yaml* ./
COPY packages/shared ./packages/shared

# Copy client_web package.json first for dependency installation
COPY client_web/package.json ./client_web/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build the shared package first (required for client_web)
WORKDIR /app/packages/shared
RUN pnpm build

# Copy all client_web source files (including config files)
WORKDIR /app
COPY client_web ./client_web

# Set working directory to client_web for build
WORKDIR /app/client_web

# Accept build arguments for Vite environment variables
ARG VITE_DEPLOY_ADDRESS
ENV VITE_DEPLOY_ADDRESS=$VITE_DEPLOY_ADDRESS

RUN pnpm build

# Start Vite preview server
CMD pnpm preview --host 0.0.0.0 --port 8081
