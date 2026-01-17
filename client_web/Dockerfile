# Stage 1: Build
FROM node:20-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json ./
COPY pnpm-lock.yaml* ./
COPY packages/shared ./packages/shared
COPY client_web/package.json ./client_web/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @area/shared build

# Copy client_web source
COPY client_web ./client_web

# Set working directory to client_web for build
WORKDIR /app/client_web

# Accept build arguments for Vite environment variables
ARG VITE_DEPLOY_ADDRESS
ENV VITE_DEPLOY_ADDRESS=$VITE_DEPLOY_ADDRESS

RUN pnpm build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /app/client_web/dist /usr/share/nginx/html
COPY client_web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
