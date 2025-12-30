# AREA - Action Reaction Automation Platform

> You are looking at an n8n-like automation project :)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## Starting the app

```bash
git clone https://github.com/EpitechPGE3-2025/G-DEV-500-LYN-5-2-area-3.git
cd G-DEV-500-LYN-5-2-area-3

docker-compose up -d

# Web: http://localhost:8081
# API: http://localhost:8080
```

## Prerequisites

- Docker & Docker Compose
- Node

## Integrated services
These services are INCOMING and not yet implemented

| Service | Actions | Reactions | Auth |
|---------|---------|-----------|------|
| Timer | 3 | 0 | None |
| Gmail | 3 | 2 | OAuth2 |
| Discord | 2 | 3 | OAuth2 |
| GitHub | 4 | 2 | OAuth2 |
| Weather | 2 | 0 | API |
| Slack | 2 | 3 | OAuth2 |

## Development

### Local Installation

```bash
# Back
cd backend
pnpm install
pnpm start:dev

# Front
cd frontend/web
pnpm install
pnpm dev

# Mobile
cd frontend/mobile
npm install
npx expo start
```

### Base de données

```bash
# Drizzle
docker compose up -d area-postgres
cd backend
pnpm db:generate && pnpm db:migrate
```

### Tests

```bash
pnpm test
npm run test:e2e
npm run test:cov
```

## Configuration

Please check our `.env.example` to setup environment variables

## Contributing

For guidelines on how to extend the project by adding new services, actions, or reactions, please refer to our [HOWTOCONTRIBUTE.md](./HOWTOCONTRIBUTE.md) documentation.

## Tech stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL + Drizzle ORM

### Frontend Web
- **Framework**: React + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: React Query

### Frontend Mobile
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State**: React Query

## Équipe

| Nom | Rôle |
|-----|------|
| Laurent GONZALEZ | Backend Lead |
| William JOLIVET | Backend Dev |
| Florian REYNAUD | Frontend Lead |
| Noa SMOTTER | Mobile Lead |
| Charly PALIERE | DevOps |
| Raphaël GEORGET | Full-Stack |

## Planning

- **Sprint 0** (Sem 1): Setup & Architecture
- **Sprint 1** (Sem 2-3): Core Foundation
- **Sprint 2** (Sem 4-5): MVP Features
- **Sprint 3** (Sem 6): Integration & Tests
- **Sprint 4** (Sem 7-8): Scale & Polish
- **Sprint 5** (Sem 9): Final Release
