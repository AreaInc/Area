# Backend Cleanup Summary

## Overview
All legacy workflow code has been removed. The application now uses only the new Temporal.io-based architecture with a simplified ONE trigger + ONE action workflow model.

## Removed Files

### API Layer
- `src/api/controllers/workflows.controller.ts` - Old workflow controller (replaced by `workflows-v2.controller.ts`)
- `src/api/controllers/service-auth.controller.ts` - Old service authentication
- `src/api/controllers/services.controller.ts` - Old service listing controller
- `src/api/controllers/webhooks.controller.ts` - Old webhook system (replaced by `gmail-webhook.controller.ts`)
- `src/api/controllers/credentials.controller.ts` - Old credentials controller (replaced by OAuth2)
- `src/api/controllers/actions.controller.ts` - Old actions controller
- `src/api/dto/*` - All old DTOs (create-workflow, execute-workflow, update-workflow, create-credentials, etc.)

### Service Layer
- `src/services/services-module.ts` - Old services module
- `src/services/services-service.ts` - Old service management
- `src/services/service-registry.ts` - Old service registry (replaced by trigger/action registries)
- `src/services/actions-service.ts` - Old actions service
- `src/services/credentials-service.ts` - Old credentials service (replaced by OAuth2)
- `src/services/workflow-execution-service.ts` - Old workflow execution (replaced by Temporal)
- `src/services/workflows-service.ts` - Old workflows service (replaced by new one in workflows/)
- `src/services/workflow-trigger-registry.ts` - Old trigger registry
- `src/services/index.ts` - Old export file

### Gmail Service (Old)
- `src/services/gmail/gmail-service.ts` - Old Gmail service class
- `src/services/gmail/gmail-credentials.ts` - Old credentials class (replaced by OAuth2)
- `src/services/gmail/index.ts` - Old export file
- `src/services/gmail/actions/read-email-action.ts` - Old action
- `src/services/gmail/actions/receive-email-trigger.ts` - Old trigger
- `src/services/gmail/actions/send-email-action.ts` - Old action (duplicate)
- `src/services/gmail/activities/send-email.activity.ts` - Old activity location

### Common/Base
- `src/common/base/base-service.ts` - Old base service class
- `src/common/base/base-credentials.ts` - Old base credentials class
- `src/common/types/interfaces.ts` - Old interface definitions (conflicted with new ones)

## New Architecture

### API Endpoints
Only v2 endpoints are now available:
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

### OAuth2 Endpoints
- `GET /api/oauth2-credential/auth` - Initiate OAuth2 flow
- `GET /api/oauth2-credential/callback` - OAuth2 callback
- `DELETE /api/oauth2-credential/:id` - Delete credentials

### Webhook Endpoints
- `POST /api/webhooks/gmail/receive` - Gmail webhook
- `POST /api/webhooks/gmail/test` - Test Gmail webhook

## Current File Structure

```
backend/src/
├── api/
│   ├── controllers/
│   │   ├── actions.controller.ts
│   │   ├── credentials.controller.ts
│   │   ├── gmail-webhook.controller.ts
│   │   ├── oauth2-credential.controller.ts
│   │   ├── users.controller.ts
│   │   └── workflows-v2.controller.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── decorators/
│   │   └── public.decorator.ts
│   └── api.module.ts
│
├── services/
│   ├── gmail/
│   │   ├── actions/
│   │   │   └── send-email.action.ts
│   │   ├── triggers/
│   │   │   └── receive-email.trigger.ts
│   │   ├── gmail-client.ts
│   │   └── gmail.module.ts
│   ├── oauth2/
│   │   ├── oauth2.service.ts
│   │   └── oauth2.module.ts
│   ├── temporal/
│   │   ├── temporal-client.service.ts
│   │   └── temporal.module.ts
│   ├── workflows/
│   │   ├── workflows.service.ts
│   │   └── workflows.module.ts
│   ├── registries/
│   │   ├── trigger-registry.service.ts
│   │   └── action-registry.service.ts
│   └── credentials-service.ts
│
├── temporal/
│   ├── workflows/
│   │   └── automation.workflow.ts
│   └── activities/
│       └── index.ts
│
├── common/
│   └── types/
│       ├── action.interface.ts
│       ├── trigger.interface.ts
│       └── enums.ts
│
├── db/
│   ├── schema.ts
│   └── drizzle.module.ts
│
├── main.ts
├── worker.ts
└── app.module.ts
```

## Database Schema Changes

### workflows table
Changed from node-based graph structure to simple trigger + action:
```sql
-- OLD
nodes JSONB
connections JSONB

-- NEW
trigger_provider VARCHAR(50)
trigger_id VARCHAR(100)
trigger_config JSONB
action_provider VARCHAR(50)
action_id VARCHAR(100)
action_config JSONB
action_credentials_id INTEGER
```

### workflow_executions table
Added Temporal tracking:
```sql
-- NEW
temporal_workflow_id VARCHAR(255)
temporal_run_id VARCHAR(255)
trigger_data JSONB
action_result JSONB
```

### credentials table
Added OAuth2 fields:
```sql
-- NEW
access_token TEXT
refresh_token TEXT
expires_at TIMESTAMP
scope TEXT
client_id TEXT
client_secret TEXT
```

## Benefits of Cleanup

1. **Simpler Codebase**: Removed ~2000+ lines of legacy code
2. **Clear Architecture**: One way to do things, no confusion
3. **Temporal Integration**: All workflow execution through Temporal
4. **OAuth2 Standard**: Industry-standard authentication flow
5. **Easier Maintenance**: Less code to maintain and debug
6. **Better Scalability**: Temporal handles all the complexity
7. **Type Safety**: Clear interfaces with no legacy conflicts

## Migration Notes

If you need to migrate existing workflows:
1. Export old workflow data
2. Convert node graphs to simple trigger + action pairs
3. Re-authenticate with OAuth2
4. Create new v2 workflows
5. Activate and test

Old workflow data in the database will remain but will not be accessible via the API.
