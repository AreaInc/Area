# Automation Platform Backend

A robust workflow automation system built with NestJS and Temporal.io, similar to n8n.

## Overview

This backend provides a workflow automation platform where users can create workflows consisting of:
- **ONE Trigger**: An event that starts the workflow (e.g., receiving an email)
- **ONE Action**: A task that executes when triggered (e.g., sending an email)

The system is powered by Temporal.io for reliable, durable workflow orchestration.

## Key Features

- **Temporal.io Integration**: Enterprise-grade workflow orchestration
- **OAuth2 Authentication**: Secure service integration (Gmail, Google APIs)
- **Gmail Service**: Receive and send emails via Gmail API
- **Clear Trigger/Action Separation**: Distinct interfaces for triggers and actions
- **Template Variables**: Use trigger data in action configurations
- **Webhook Support**: Real-time event processing
- **Scalable Architecture**: Horizontal scaling via Temporal workers
- **Execution History**: Track all workflow runs via Temporal UI

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose
- Google OAuth2 Credentials ([Get them here](https://console.cloud.google.com/))

### 2. Configure Environment

Create a `.env` file in the `backend` directory:

```env
# Google OAuth2 (required)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
OAUTH_CALLBACK_URL=http://localhost:8080/api/oauth2-credential/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Database
POSTGRES_HOST=haproxy
POSTGRES_PORT=5000
POSTGRES_NAME=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Temporal
TEMPORAL_ADDRESS=temporal:7233

# Backend
BACKEND_PORT=8080
BETTER_AUTH_SECRET=your_secret_key
```

### 3. Start Services

```bash
cd backend
docker-compose up -d
```

This starts:
- **Backend API** (port 8080)
- **Temporal Server** (ports 7233, 8233)
- **Temporal Worker**
- **PostgreSQL** (Patroni cluster)
- **Redis** cache
- **Vault** for secrets

### 4. Access Services

- **Backend API**: http://localhost:8080
- **Temporal UI**: http://localhost:8233
- **API Documentation**: http://localhost:8080/api/docs (if Swagger enabled)

## Architecture

The system follows a clean architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│       API Layer (NestJS)            │
│  - REST Controllers                 │
│  - OAuth2 Endpoints                 │
│  - Webhook Handlers                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Layer                  │
│  - Temporal Client                  │
│  - Workflow Management              │
│  - Trigger/Action Registries        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Temporal Worker Process           │
│  - Workflow Definitions             │
│  - Activity Implementations         │
│  - Gmail Integration                │
└─────────────────────────────────────┘
```

## Creating Your First Workflow

### Step 1: Authenticate with Gmail

```bash
# Visit this URL in your browser (while logged in)
http://localhost:8080/api/oauth2-credential/auth?provider=gmail
```

### Step 2: Create a Workflow

```bash
curl -X POST "http://localhost:8080/api/v2/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Forward Important Emails",
    "trigger": {
      "provider": "gmail",
      "triggerId": "receive-email",
      "config": {
        "from": "boss@company.com"
      }
    },
    "action": {
      "provider": "gmail",
      "actionId": "send-email",
      "config": {
        "to": "personal@gmail.com",
        "subject": "FWD: {{subject}}",
        "body": "From: {{from}}\n\n{{body}}"
      },
      "credentialsId": 1
    }
  }'
```

### Step 3: Activate the Workflow

```bash
curl -X POST "http://localhost:8080/api/v2/workflows/1/activate" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

That's it! Your workflow is now active and will automatically forward emails from your boss to your personal email.

## Available Triggers and Actions

### Gmail Triggers

- **receive-email**: Triggers when a new email is received
  - Filter by sender (`from`)
  - Filter by subject (`subject`)
  - Filter by labels (`labelIds`)

### Gmail Actions

- **send-email**: Send an email via Gmail
  - Required: `to`, `subject`, `body`
  - Optional: `cc`, `bcc`, `isHtml`
  - Supports template variables from trigger data

## Template Variables

Use trigger data in your actions with `{{variableName}}` syntax:

- `{{from}}` - Sender email address
- `{{to}}` - Recipient email address
- `{{subject}}` - Email subject
- `{{body}}` - Email body (plain text)
- `{{htmlBody}}` - Email body (HTML)
- `{{date}}` - Email date
- `{{messageId}}` - Gmail message ID
- `{{threadId}}` - Gmail thread ID

Example:
```json
{
  "to": "alerts@company.com",
  "subject": "New email from {{from}}",
  "body": "Subject: {{subject}}\n\n{{body}}"
}
```

## API Endpoints

### Workflows

All workflow endpoints are under `/api/v2/workflows`:

- `POST /api/v2/workflows` - Create workflow
- `GET /api/v2/workflows` - List workflows
- `GET /api/v2/workflows/:id` - Get workflow
- `PUT /api/v2/workflows/:id` - Update workflow
- `DELETE /api/v2/workflows/:id` - Delete workflow
- `POST /api/v2/workflows/:id/activate` - Activate workflow
- `POST /api/v2/workflows/:id/deactivate` - Deactivate workflow
- `POST /api/v2/workflows/:id/execute` - Execute workflow manually
- `GET /api/v2/workflows/:id/executions` - Get execution history
- `GET /api/v2/workflows/metadata/triggers` - List available triggers
- `GET /api/v2/workflows/metadata/actions` - List available actions

**Note**: Legacy v1 workflow endpoints have been removed. All workflows must use the new simplified structure (ONE trigger + ONE action).

### OAuth2

- `GET /api/oauth2-credential/auth` - Initiate OAuth2 flow
- `GET /api/oauth2-credential/callback` - OAuth2 callback
- `DELETE /api/oauth2-credential/:id` - Delete credentials

### Webhooks

- `POST /api/webhooks/gmail/receive` - Gmail webhook endpoint
- `POST /api/webhooks/gmail/test` - Test Gmail webhook

## Monitoring

### Temporal UI

Access the Temporal UI at http://localhost:8233 to:
- View all workflow executions
- See execution history and status
- Debug failed workflows
- Monitor retry attempts

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Worker logs
docker-compose logs -f worker

# Temporal logs
docker-compose logs -f temporal
```

## Documentation

- **[User Guide](USER_GUIDE.md)**: Comprehensive guide for using the application
- **[Architecture](ARCHITECTURE.md)**: Detailed architecture documentation
- **[Temporal Docs](https://docs.temporal.io/)**: Official Temporal documentation
- **[Gmail API](https://developers.google.com/gmail/api)**: Gmail API reference

## Development

### Project Structure

```
backend/
├── src/
│   ├── api/                    # REST API controllers
│   │   └── controllers/
│   ├── services/              # Business logic
│   │   ├── gmail/            # Gmail service
│   │   │   ├── triggers/     # Trigger definitions
│   │   │   ├── actions/      # Action definitions
│   │   │   └── gmail-client.ts
│   │   ├── oauth2/           # OAuth2 service
│   │   ├── temporal/         # Temporal client
│   │   ├── workflows/        # Workflow service
│   │   └── registries/       # Trigger/Action registries
│   ├── temporal/             # Temporal workflows & activities
│   │   ├── workflows/
│   │   └── activities/
│   ├── db/                   # Database (Drizzle ORM)
│   ├── common/               # Shared types and utilities
│   ├── main.ts              # Backend entry point
│   └── worker.ts            # Worker entry point
├── docker-compose.yml       # Services configuration
├── Dockerfile              # Backend image
├── Dockerfile.worker       # Worker image
└── package.json           # Dependencies
```

### Adding New Services

To add a new service (e.g., Slack):

1. Create service directory: `src/services/slack/`
2. Implement triggers and actions
3. Create Temporal activities
4. Register in service module
5. Add to app module imports

See `src/services/gmail/` for a complete example.

### Running Tests

```bash
pnpm test
```

## Scaling

Scale workers horizontally for better performance:

```bash
docker-compose up -d --scale worker=3
```
