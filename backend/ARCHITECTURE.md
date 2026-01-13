# Backend Architecture - Temporal.io Integration

## Overview

This document outlines the refactored architecture integrating Temporal.io for workflow orchestration. The system follows a clear separation between triggers (workflow initiators) and actions (workflow tasks).

## Core Concepts

### Workflows
- **Definition**: A workflow consists of ONE trigger and ONE action
- **Execution**: Managed by Temporal workflows
- **State**: Durable and fault-tolerant through Temporal

### Triggers
- **Purpose**: Initiate workflow execution
- **Types**:
  - **Event-based**: External events (Gmail push notifications, webhooks)
  - **Scheduled**: Time-based triggers (cron)
  - **Manual**: User-initiated execution
- **Implementation**: Separate from actions, registered as workflow starters

### Actions
- **Purpose**: Execute business logic as part of workflow
- **Implementation**: Temporal Activities
- **Characteristics**: Idempotent, retryable, timeout-aware

## Architecture Components

### 1. Temporal Components

#### Temporal Server
- Orchestrates workflow execution
- Maintains workflow state
- Handles retries and failures
- Provides workflow history

#### Temporal Worker
- Executes workflows and activities
- Polls task queues
- Runs in separate process/container
- Scalable horizontally

#### Task Queues
- `automation-workflows`: Main workflow queue
- Service-specific queues: `gmail-queue`, `slack-queue`, etc.

### 2. Application Layers

```
┌─────────────────────────────────────────────────────────┐
│                     API Layer (NestJS)                   │
│  - REST Controllers                                      │
│  - OAuth2 Callback Endpoint                              │
│  - Workflow Management                                   │
│  - Trigger Registration                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  Service Layer                           │
│  - Temporal Client (start workflows)                     │
│  - Credential Management                                 │
│  - Trigger Registry                                      │
│  - OAuth2 Service                                        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Temporal Worker Process                     │
│  ┌─────────────────────────────────────────────┐        │
│  │         Workflow Definitions                 │        │
│  │  - Execute trigger → action flow             │        │
│  │  - Handle errors and retries                 │        │
│  └─────────────────┬───────────────────────────┘        │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────┐        │
│  │      Activity Implementations                │        │
│  │  - Gmail Activities (send, read)             │        │
│  │  - Other Service Activities                  │        │
│  │  - Use Service Clients for API calls         │        │
│  └──────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                External Services                         │
│  - Gmail API (via OAuth2)                                │
│  - Other Service APIs                                    │
└──────────────────────────────────────────────────────────┘
```

### 3. Data Flow

#### OAuth2 Flow
```
1. User → GET /api/oauth2-credential/auth?provider=gmail
   ← Redirect to Google consent screen

2. Google → GET /api/oauth2-credential/callback?code=xxx&state=yyy
   → Exchange code for tokens
   → Store encrypted credentials in DB
   ← Success response

3. Credentials stored with:
   - accessToken (encrypted)
   - refreshToken (encrypted)
   - expiresAt
   - scope
   - serviceProvider
```

#### Workflow Creation Flow
```
1. User → POST /api/workflows
   Body: {
     name: "Forward Emails",
     trigger: {
       serviceProvider: "gmail",
       triggerId: "receive-email",
       config: { from: "boss@company.com" }
     },
     action: {
       serviceProvider: "gmail",
       actionId: "send-email",
       config: { to: "personal@gmail.com" },
       credentialsId: 123
     }
   }

2. Backend validates:
   - Trigger exists and is valid
   - Action exists and is valid
   - Credentials belong to user
   - Schema validation passes

3. Store workflow in DB
4. Register trigger with Trigger Manager
5. Return workflow ID
```

#### Workflow Execution Flow
```
1. Trigger fires (e.g., Gmail push notification)
   → Trigger Manager identifies workflows

2. For each workflow:
   → Start Temporal workflow via client
   → Pass trigger data as input

3. Temporal Worker executes workflow:
   ┌──────────────────────────────────┐
   │ Workflow: AutomationWorkflow     │
   │                                  │
   │ 1. Receive trigger data          │
   │ 2. Load workflow config          │
   │ 3. Execute action activity       │
   │    - Load credentials            │
   │    - Create service client       │
   │    - Execute action logic        │
   │    - Return result               │
   │ 4. Log execution result          │
   │ 5. Complete workflow             │
   └──────────────────────────────────┘

4. Result stored in workflow_executions table
```

## Database Schema Changes

### workflows table
```sql
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Trigger configuration (ONE trigger)
  trigger_provider VARCHAR(50) NOT NULL,  -- 'gmail', 'slack', etc.
  trigger_id VARCHAR(100) NOT NULL,       -- 'receive-email'
  trigger_config JSONB NOT NULL DEFAULT '{}',

  -- Action configuration (ONE action)
  action_provider VARCHAR(50) NOT NULL,   -- 'gmail', 'slack', etc.
  action_id VARCHAR(100) NOT NULL,        -- 'send-email'
  action_config JSONB NOT NULL DEFAULT '{}',
  action_credentials_id INTEGER REFERENCES credentials(id),

  is_active BOOLEAN DEFAULT FALSE,
  last_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### credentials table (updated)
```sql
CREATE TABLE credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  service_provider VARCHAR(50) NOT NULL,
  credential_type VARCHAR(50) NOT NULL,  -- 'oauth2'
  name VARCHAR(255) NOT NULL,

  -- OAuth2 fields (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  scope TEXT,

  -- OAuth2 configuration
  client_id TEXT,      -- User-provided from Google Console
  client_secret TEXT,  -- User-provided (encrypted)

  is_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, service_provider, name)
);
```

### workflow_executions table (updated)
```sql
CREATE TABLE workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id),
  user_id INTEGER NOT NULL REFERENCES users(id),

  -- Temporal workflow info
  temporal_workflow_id VARCHAR(255) NOT NULL,
  temporal_run_id VARCHAR(255) NOT NULL,

  status VARCHAR(50) NOT NULL,  -- 'running', 'completed', 'failed', 'cancelled'

  trigger_data JSONB,    -- Input from trigger
  action_result JSONB,   -- Output from action
  error_message TEXT,

  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  INDEX(temporal_workflow_id),
  INDEX(workflow_id, started_at DESC)
);
```

## Service Structure

### Gmail Service Structure
```
services/gmail/
├── gmail.module.ts           # NestJS module
├── gmail.service.ts          # Service orchestrator
├── gmail-client.ts           # API client (unchanged)
├── gmail-credentials.ts      # Credential handler (updated for OAuth2)
│
├── triggers/
│   └── receive-email.trigger.ts    # Trigger definition
│
├── activities/
│   ├── send-email.activity.ts      # Temporal activity
│   └── read-email.activity.ts      # Temporal activity
│
└── workflows/
    └── automation.workflow.ts      # Temporal workflow definition
```

## Temporal Integration Details

### Workflow Definition
```typescript
// workflows/automation.workflow.ts
import { proxyActivities } from '@temporalio/workflow';

const activities = proxyActivities({
  startToCloseTimeout: '5 minutes',
});

export async function automationWorkflow(input: {
  workflowId: number;
  triggerId: string;
  triggerData: any;
  actionProvider: string;
  actionId: string;
  actionConfig: any;
  credentialsId: number;
}) {
  // Execute the action activity
  const activityName = `${input.actionProvider}.${input.actionId}`;
  const result = await activities[activityName]({
    config: input.actionConfig,
    triggerData: input.triggerData,
    credentialsId: input.credentialsId,
  });

  return result;
}
```

### Activity Definition
```typescript
// activities/send-email.activity.ts
export async function sendEmail(params: {
  config: { to: string; subject: string; body: string };
  triggerData: any;
  credentialsId: number;
}) {
  // 1. Load credentials from DB
  const credentials = await credentialsService.getById(params.credentialsId);

  // 2. Create Gmail client
  const client = new GmailClient(credentials);

  // 3. Merge config with trigger data (template variables)
  const emailData = mergeTemplateVariables(params.config, params.triggerData);

  // 4. Send email via Gmail API
  const result = await client.sendEmail(emailData);

  return result;
}
```

### Worker Setup
```typescript
// worker.ts
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

const worker = await Worker.create({
  workflowsPath: require.resolve('./workflows'),
  activities,
  taskQueue: 'automation-workflows',
});

await worker.run();
```

## Trigger System

### Trigger Registration
- When workflow is activated, trigger is registered in Trigger Manager
- Trigger Manager maintains in-memory map: `triggerId -> workflowIds[]`
- External events (webhooks, push notifications) fire triggers
- Trigger Manager starts Temporal workflows for all registered workflows

### Gmail Receive-Email Trigger
Uses Gmail Push API (Cloud Pub/Sub):
1. Set up Pub/Sub topic and subscription
2. Configure watch on user's mailbox
3. Receive push notifications on new emails
4. Webhook endpoint processes notification
5. Fetch email details via Gmail API
6. Fire trigger to start workflows

## OAuth2 Implementation

### Endpoints

**GET /api/oauth2-credential/auth**
- Query: `provider`, `redirectUrl` (optional)
- Generates state token
- Redirects to OAuth provider (Google)

**GET /api/oauth2-credential/callback**
- Query: `code`, `state`
- Exchanges code for tokens
- Stores encrypted credentials
- Redirects to frontend with success/error

**POST /api/oauth2-credential/store**
- Body: `provider`, `clientId`, `clientSecret`, `name`
- Stores OAuth2 app credentials
- Returns credential ID

### Security
- State parameter prevents CSRF
- Tokens encrypted at rest (using Vault)
- Refresh tokens securely stored
- Automatic token refresh before expiration

## Deployment

### Docker Compose Services
```yaml
services:
  # Temporal Server
  temporal:
    image: temporalio/auto-setup:latest
    ports:
      - "7233:7233"  # gRPC
      - "8233:8233"  # UI
    environment:
      - DB=postgresql
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_SEEDS=postgres

  # Backend API
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
    depends_on:
      - temporal
      - postgres

  # Temporal Worker
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
      - POSTGRES_HOST=haproxy
    depends_on:
      - temporal
      - postgres
```

## Migration Strategy

1. **Phase 1**: Set up Temporal infrastructure
   - Add Temporal server to docker-compose
   - Install Temporal SDK
   - Create worker process

2. **Phase 2**: Implement OAuth2
   - Create OAuth2 endpoints
   - Update credential storage
   - Update Gmail client for OAuth2

3. **Phase 3**: Refactor workflows
   - Update database schema
   - Migrate to new workflow structure
   - Implement trigger/action distinction

4. **Phase 4**: Implement Gmail
   - Create Gmail activities
   - Create automation workflow
   - Implement receive-email trigger
   - Test end-to-end flow

5. **Phase 5**: Clean up
   - Remove old workflow execution code
   - Remove webhook code
   - Update API controllers
   - Write documentation

## Benefits of This Architecture

1. **Durability**: Temporal handles workflow state persistence
2. **Reliability**: Automatic retries and error handling
3. **Scalability**: Workers can scale independently
4. **Observability**: Temporal UI provides workflow visibility
5. **Simplicity**: Clear separation of concerns
6. **Extensibility**: Easy to add new services/triggers/actions
