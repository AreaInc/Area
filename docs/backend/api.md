# API Reference

> **REST API Endpoints for the AREA Platform.**

Base URL: `http://localhost:8080` (default)

## 🔐 Authentication

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/auth/:provider` | Start OAuth flow for a provider (google, spotify, etc). |
| `GET` | `/auth/:provider/callback` | Callback handling for OAuth code exchange. |
| `GET` | `/oauth2/credentials` | List user's connected credentials. |
| `DELETE`| `/oauth2/credentials/:id`| Remove a credential. |

## 🚀 Workflows (AREAs)

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/workflows` | List all user workflows. | - |
| `GET` | `/workflows/:id` | Get details of a workflow. | - |
| `POST` | `/workflows` | Create a new workflow. | `{ name, trigger, action, ... }` |
| `PATCH` | `/workflows/:id` | Update a workflow. | `{ name, active, ... }` |
| `DELETE`| `/workflows/:id` | Delete a workflow. | - |

## 🧩 Services

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/services` | List all available services. |
| `GET` | `/services/:id/triggers` | List triggers for a service. |
| `GET` | `/services/:id/actions` | List actions for a service. |

## 👤 Users

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users/me` | Get current user's profile. |
| `PATCH` | `/users/me` | Update user profile. |

> **Note**: Most endpoints require a valid JWT Bearer token in the `Authorization` header.
