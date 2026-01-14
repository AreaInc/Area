# Automation Platform User Guide

## Overview

This automation platform allows you to create workflows that connect triggers and actions, similar to n8n or Zapier. The system uses Temporal.io for robust workflow orchestration and supports OAuth2 authentication for external services.

## Key Concepts

### Workflows
A **workflow** consists of:
- **ONE Trigger**: An event that starts the workflow (e.g., "Receive Email")
- **ONE Action**: A task that executes when the trigger fires (e.g., "Send Email")

### Triggers
Triggers are events that start workflow execution:
- **Event-based**: Real-time notifications (Gmail push notifications)
- **Manual**: User-initiated execution

### Actions
Actions are tasks performed as part of the workflow:
- Execute business logic
- Integrate with external services
- Support template variables from trigger data

### Temporal.io Integration
All workflows are executed via Temporal, providing:
- Durability: Workflow state persists across failures
- Retries: Automatic retry on failures
- Visibility: View workflow execution history in Temporal UI
- Scalability: Horizontal scaling of workers

---

## Setup Guide

### Prerequisites

1. **Google OAuth2 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API
   - Create OAuth2 credentials (OAuth 2.0 Client ID)
   - Download client ID and client secret

2. **Environment Variables**
   ```bash
   # Google OAuth2 (required for Gmail integration)
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   OAUTH_CALLBACK_URL=http://localhost:8080/api/oauth2-credential/callback

   # Frontend URL (for OAuth2 redirects)
   FRONTEND_URL=http://localhost:3000

   # Temporal
   TEMPORAL_ADDRESS=temporal:7233

   # Database
   POSTGRES_HOST=haproxy
   POSTGRES_PORT=5000
   POSTGRES_NAME=postgres
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   ```

### Starting the Application

1. **Start all services with Docker Compose:**
   ```bash
   cd backend
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL database (Patroni cluster)
   - Redis cache
   - Vault for secrets
   - Temporal server
   - Backend API server
   - Temporal worker

2. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

   You should see:
   - `area-backend` (port 8080)
   - `area-worker`
   - `area-temporal` (ports 7233, 8233)
   - Database and cache services

3. **Access Temporal UI:**
   Open http://localhost:8233 in your browser to view workflow executions.

---

## Usage Guide

### Step 1: Authenticate with Gmail

Before creating workflows, you need to connect your Gmail account.

**API Endpoint: GET /api/oauth2-credential/auth**

```bash
# Initiate OAuth2 flow
curl -X GET "http://localhost:8080/api/oauth2-credential/auth?provider=gmail" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -L
```

This will:
1. Redirect you to Google's consent screen
2. Ask for permission to access your Gmail
3. Redirect back to the application with credentials stored

**Alternative: Using Browser**
Simply open this URL in your browser while logged in:
```
http://localhost:8080/api/oauth2-credential/auth?provider=gmail
```

### Step 2: Create a Workflow

Create a workflow with one trigger and one action.

**API Endpoint: POST /api/v2/workflows**

#### Example: Forward Emails from Boss to Personal Email

```bash
curl -X POST "http://localhost:8080/api/v2/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Forward Boss Emails",
    "description": "Forward all emails from my boss to my personal email",
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
        "body": "From: {{from}}\\nDate: {{date}}\\n\\n{{body}}"
      },
      "credentialsId": 1
    }
  }'
```

**Response:**
```json
{
  "id": 1,
  "userId": "user-123",
  "name": "Forward Boss Emails",
  "description": "Forward all emails from my boss to my personal email",
  "triggerProvider": "gmail",
  "triggerId": "receive-email",
  "triggerConfig": {
    "from": "boss@company.com"
  },
  "actionProvider": "gmail",
  "actionId": "send-email",
  "actionConfig": {
    "to": "personal@gmail.com",
    "subject": "FWD: {{subject}}",
    "body": "From: {{from}}\\nDate: {{date}}\\n\\n{{body}}"
  },
  "actionCredentialsId": 1,
  "isActive": false,
  "createdAt": "2026-01-10T10:00:00Z",
  "updatedAt": "2026-01-10T10:00:00Z"
}
```

### Step 3: Activate the Workflow

Activate the workflow to start listening for triggers.

**API Endpoint: POST /api/v2/workflows/:id/activate**

```bash
curl -X POST "http://localhost:8080/api/v2/workflows/1/activate" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Response:**
```json
{
  "success": true
}
```

The workflow is now active and will automatically execute when matching emails are received.

### Step 4: Test the Workflow Manually

You can manually test the workflow before relying on automatic triggers.

**API Endpoint: POST /api/v2/workflows/:id/execute**

```bash
curl -X POST "http://localhost:8080/api/v2/workflows/1/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "triggerData": {
      "from": "boss@company.com",
      "to": "me@company.com",
      "subject": "Urgent: Project Update",
      "body": "Please review the attached document.",
      "date": "2026-01-10T10:00:00Z",
      "messageId": "msg-123",
      "threadId": "thread-456"
    }
  }'
```

**Response:**
```json
{
  "id": 1,
  "workflowId": 1,
  "userId": "user-123",
  "temporalWorkflowId": "workflow-1-1736503200000",
  "temporalRunId": "abc123-def456-ghi789",
  "status": "running",
  "triggerData": {
    "from": "boss@company.com",
    "to": "me@company.com",
    "subject": "Urgent: Project Update",
    "body": "Please review the attached document.",
    "date": "2026-01-10T10:00:00Z"
  },
  "startedAt": "2026-01-10T10:00:00Z"
}
```

### Step 5: View Execution History

Check the execution history of your workflow.

**API Endpoint: GET /api/v2/workflows/:id/executions**

```bash
curl -X GET "http://localhost:8080/api/v2/workflows/1/executions" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Response:**
```json
[
  {
    "id": 1,
    "workflowId": 1,
    "userId": "user-123",
    "temporalWorkflowId": "workflow-1-1736503200000",
    "temporalRunId": "abc123-def456-ghi789",
    "status": "completed",
    "triggerData": {
      "from": "boss@company.com",
      "subject": "Urgent: Project Update"
    },
    "actionResult": {
      "success": true,
      "messageId": "msg-789",
      "threadId": "thread-012"
    },
    "startedAt": "2026-01-10T10:00:00Z",
    "completedAt": "2026-01-10T10:00:05Z"
  }
]
```

---

## Template Variables

Actions support template variables that are replaced with data from the trigger.

### Available Variables (Gmail Receive Email Trigger)

- `{{messageId}}` - Gmail message ID
- `{{threadId}}` - Gmail thread ID
- `{{from}}` - Sender email address
- `{{to}}` - Recipient email address
- `{{subject}}` - Email subject
- `{{body}}` - Email body (plain text)
- `{{htmlBody}}` - Email body (HTML)
- `{{date}}` - Email date

### Example Usage

```json
{
  "action": {
    "provider": "gmail",
    "actionId": "send-email",
    "config": {
      "to": "alerts@company.com",
      "subject": "New email from {{from}}",
      "body": "You received an email with subject: {{subject}}\\n\\nBody:\\n{{body}}"
    }
  }
}
```

---

## API Reference

### Authentication

All endpoints (except OAuth2 callbacks and webhooks) require authentication.

Include the session token in the `Authorization` header:
```
Authorization: Bearer YOUR_SESSION_TOKEN
```

### Workflows API (v2)

#### Create Workflow
**POST /api/v2/workflows**

Request body:
```json
{
  "name": "string",
  "description": "string (optional)",
  "trigger": {
    "provider": "gmail",
    "triggerId": "receive-email",
    "config": {
      "from": "string (optional)",
      "subject": "string (optional)",
      "labelIds": ["string"] (optional)
    }
  },
  "action": {
    "provider": "gmail",
    "actionId": "send-email",
    "config": {
      "to": "string (required)",
      "subject": "string (required)",
      "body": "string (required)",
      "cc": ["string"] (optional),
      "bcc": ["string"] (optional),
      "isHtml": boolean (optional)
    },
    "credentialsId": number (required)
  }
}
```

#### List Workflows
**GET /api/v2/workflows**

Returns all workflows for the authenticated user.

#### Get Workflow
**GET /api/v2/workflows/:id**

Returns a single workflow by ID.

#### Update Workflow
**PUT /api/v2/workflows/:id**

Request body: Same as create, but all fields are optional.

#### Delete Workflow
**DELETE /api/v2/workflows/:id**

Deletes the workflow. Automatically deactivates if active.

#### Activate Workflow
**POST /api/v2/workflows/:id/activate**

Starts listening for triggers.

#### Deactivate Workflow
**POST /api/v2/workflows/:id/deactivate**

Stops listening for triggers.

#### Execute Workflow
**POST /api/v2/workflows/:id/execute**

Manually execute the workflow with custom trigger data.

Request body:
```json
{
  "triggerData": {
    "key": "value"
  }
}
```

#### Get Executions
**GET /api/v2/workflows/:id/executions**

Returns execution history for the workflow.

#### Get Available Triggers
**GET /api/v2/workflows/metadata/triggers**

Returns all available triggers with their schemas.

#### Get Available Actions
**GET /api/v2/workflows/metadata/actions**

Returns all available actions with their schemas.

### OAuth2 API

#### Initiate OAuth2 Flow
**GET /api/oauth2-credential/auth**

Query parameters:
- `provider`: OAuth2 provider (e.g., "gmail")
- `redirectUrl`: Optional redirect URL after authentication

#### OAuth2 Callback
**GET /api/oauth2-credential/callback**

Handles OAuth2 callback from the provider. Called automatically by Google.

#### Delete Credentials
**DELETE /api/oauth2-credential/:credentialId**

Deletes stored OAuth2 credentials.

### Webhook API

#### Gmail Receive Email Webhook
**POST /api/webhooks/gmail/receive**

Processes incoming Gmail notifications.

Request body:
```json
{
  "messageId": "string",
  "threadId": "string",
  "from": "string",
  "to": "string",
  "subject": "string",
  "body": "string",
  "htmlBody": "string (optional)",
  "date": "string (ISO 8601)",
  "attachments": [
    {
      "filename": "string",
      "mimeType": "string",
      "size": number,
      "attachmentId": "string"
    }
  ]
}
```

#### Test Gmail Webhook
**POST /api/webhooks/gmail/test**

Test endpoint with sample data.

Request body:
```json
{
  "from": "string (optional)",
  "to": "string (optional)",
  "subject": "string (optional)",
  "body": "string (optional)"
}
```

---

## Monitoring and Debugging

### Temporal UI

Access the Temporal UI at http://localhost:8233 to:
- View all workflow executions
- See workflow history and status
- Inspect failed workflows
- View retry attempts
- Debug workflow issues

### Logs

View backend logs:
```bash
docker-compose logs -f backend
```

View worker logs:
```bash
docker-compose logs -f worker
```

View Temporal logs:
```bash
docker-compose logs -f temporal
```

### Database

Connect to the database to inspect workflow and execution records:
```bash
docker-compose exec patroni1 psql -U postgres -d postgres

# View workflows
SELECT id, name, trigger_provider, trigger_id, action_provider, action_id, is_active FROM workflows;

# View executions
SELECT id, workflow_id, status, started_at, completed_at FROM workflow_executions ORDER BY started_at DESC LIMIT 10;
```

---

## Common Issues and Solutions

### Issue: OAuth2 Flow Fails

**Symptoms:**
- Redirect to Google fails
- "OAuth2 client credentials not configured" error

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables are set
2. Ensure the redirect URI in Google Console matches `OAUTH_CALLBACK_URL`
3. Enable Gmail API in Google Cloud Console

### Issue: Workflow Doesn't Trigger

**Symptoms:**
- Workflow is active but doesn't execute
- Webhook receives data but no execution starts

**Solution:**
1. Check if workflow is activated: `GET /api/v2/workflows/:id`
2. Verify trigger configuration matches incoming data
3. Check worker logs for errors: `docker-compose logs -f worker`
4. Ensure Temporal worker is running: `docker-compose ps worker`

### Issue: Action Fails with Credential Error

**Symptoms:**
- Workflow execution shows "Credentials not found"
- Action fails with authentication error

**Solution:**
1. Verify credential ID exists and belongs to the user
2. Check if OAuth2 token has expired (re-authenticate if needed)
3. Ensure action requires credentials and `credentialsId` is provided

### Issue: Temporal Connection Fails

**Symptoms:**
- "Failed to connect to Temporal server" error
- Worker or backend can't start

**Solution:**
1. Verify Temporal server is running: `docker-compose ps temporal`
2. Check Temporal logs: `docker-compose logs temporal`
3. Ensure `TEMPORAL_ADDRESS` environment variable is correct
4. Restart Temporal: `docker-compose restart temporal`

---

## Best Practices

1. **Test Before Activating**
   - Use manual execution to test workflows before activating
   - Verify template variables work correctly

2. **Use Descriptive Names**
   - Give workflows clear, descriptive names
   - Include trigger and action in the description

3. **Monitor Executions**
   - Regularly check execution history
   - Use Temporal UI to debug failed workflows

4. **Secure Credentials**
   - Don't share credential IDs
   - Re-authenticate if credentials are compromised
   - Rotate credentials periodically

5. **Handle Failures Gracefully**
   - Configure retry policies in Temporal
   - Add error handling in actions
   - Monitor failed executions

---

## Advanced Topics

### Adding New Services

To add support for a new service (e.g., Slack, Discord):

1. Create a new directory: `src/services/[service-name]/`
2. Implement triggers in `triggers/`
3. Implement actions in `actions/`
4. Create activities in `src/temporal/activities/`
5. Register in the service module
6. Add to app module imports

### Custom Temporal Workers

You can create specialized workers for different task queues:

1. Create a new worker file: `src/worker-[name].ts`
2. Configure with a different task queue
3. Add to Docker Compose with a new service

### Scaling

Scale workers horizontally for better performance:

```bash
docker-compose up -d --scale worker=3
```

This starts 3 worker instances that share the workload.

---

## Conclusion

This automation platform provides a robust foundation for building workflow automations. With Temporal.io integration, you get enterprise-grade reliability and visibility for all your workflows.

For questions or issues, please refer to:
- Architecture documentation: `ARCHITECTURE.md`
- Temporal documentation: https://docs.temporal.io/
- Google Gmail API: https://developers.google.com/gmail/api
