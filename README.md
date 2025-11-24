# AREA - Action Reaction Automation Platform

> Plateforme d'automatisation connectant différents services via des Actions et Réactions (similaire à IFTTT/Zapier)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## 🚀 Démarrage Rapide

```bash
# Cloner le repository
git clone https://github.com/EpitechPGE3-2025/G-DEV-500-LYN-5-2-area-3.git
cd G-DEV-500-LYN-5-2-area-3

# Lancer l'application avec Docker
docker-compose up -d

# Accéder à l'application
# Web: http://localhost:8081
# API: http://localhost:8080
```

## 📋 Prérequis

- Docker & Docker Compose
- Node.js 24 (pour le développement local)
- PostgreSQL 15+
- Redis 7+

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│ API Gateway │
│ (React/TS)  │     │  (NestJS)   │
└─────────────┘     └──────┬──────┘
                           │
┌─────────────┐           │
│ Mobile App  │───────────┤
│(React Native)│          │
└─────────────┘     ┌─────▼──────────────┐
                    │  Microservices     │
                    ├────────────────────┤
                    │ • Auth Service     │
                    │ • Core Service     │
                    │ • Hook Manager     │
                    │ • Worker Queue     │
                    └─────┬──────────────┘
                          │
                    ┌─────▼──────────┐
                    │ PostgreSQL     │
                    │ Redis          │
                    └────────────────┘
```

### Services Microservices

- **API Gateway**: Point d'entrée, routing et authentification
- **Auth Service**: Gestion utilisateurs et OAuth2
- **Core Service**: Gestion des AREAs (CRUD)
- **Hook Manager**: Surveillance des triggers
- **Worker Service**: Exécution des réactions

## 🔌 Services Intégrés

| Service | Actions | Reactions | Auth |
|---------|---------|-----------|------|
| Timer | 3 | 0 | None |
| Gmail | 3 | 2 | OAuth2 |
| Discord | 2 | 3 | OAuth2 |
| GitHub | 4 | 2 | OAuth2 |
| Weather | 2 | 0 | API Key |
| Slack | 2 | 3 | OAuth2 |

## 📦 Structure du Projet

```
area-project/
├── backend/
│   ├── apps/
│   │   ├── api-gateway/      # Point d'entrée API
│   │   ├── auth-service/     # Authentification
│   │   ├── core-service/     # Logique AREA
│   │   └── worker-service/   # Exécution asynchrone
│   └── libs/                 # Bibliothèques partagées
├── frontend/
│   ├── web/                  # Application React
│   └── mobile/               # Application React Native
├── docker-compose.yml
└── README.md
```

## 🛠️ Développement

### Installation locale

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend Web
cd frontend/web
npm install
npm run dev

# Frontend Mobile
cd frontend/mobile
npm install
npx expo start
```

### Base de données

```bash
# Migrations
npx prisma migrate dev

# Studio (GUI)
npx prisma studio
```

### Tests

```bash
# Backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend
npm run test
npm run test:coverage
```

## 🔐 Configuration

Créer un fichier `.env` à la racine :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/area_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"

# OAuth2 Providers
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
```

## 📚 API Documentation

L'API REST est documentée avec Swagger :

```
http://localhost:8080/api/docs
```

### Endpoints principaux

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/services` - Liste des services
- `POST /api/areas` - Créer une AREA
- `GET /api/areas` - Lister les AREAs
- `PUT /api/areas/:id` - Modifier une AREA
- `DELETE /api/areas/:id` - Supprimer une AREA

## 🐳 Docker

```bash
# Build et démarrage
docker-compose up --build -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Nettoyer volumes
docker-compose down -v
```

## 🧪 Technologies

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Queue**: Redis + BullMQ
- **Auth**: JWT + OAuth2
- **Validation**: class-validator
- **Testing**: Jest

### Frontend Web
- **Framework**: React + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: React Query
- **Forms**: React Hook Form

### Frontend Mobile
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State**: React Query

## 👥 Équipe

| Nom | Rôle |
|-----|------|
| Laurent GONZALEZ | Backend Lead |
| William JOLIVET | Backend Dev |
| Florian REYNAUD | Frontend Lead |
| Noa SMOTTER | Mobile Lead |
| Charly PALIERE | DevOps |
| Raphaël GEORGET | Full-Stack |

## 📅 Planning

- **Sprint 0** (Sem 1): Setup & Architecture
- **Sprint 1** (Sem 2-3): Core Foundation
- **Sprint 2** (Sem 4-5): MVP Features
- **Sprint 3** (Sem 6): Integration & Tests
- **Sprint 4** (Sem 7-8): Scale & Polish
- **Sprint 5** (Sem 9): Final Release

## 📝 License

Ce projet est réalisé dans le cadre d'un projet académique à Epitech.

---

**Date de début**: 17 Novembre 2024  
**Date de fin**: 19 Janvier 2025  
**Durée**: 9 semaines