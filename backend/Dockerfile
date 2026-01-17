FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml* ./

RUN npm install -g pnpm && pnpm install

COPY . .

ENV NODE_OPTIONS=--max_old_space_size=3072
RUN pnpm build

FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml* ./

RUN npm install -g pnpm && pnpm install --prod

COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/src/main"]
