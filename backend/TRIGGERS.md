# Workflow Triggers Implementation

This document explains how the trigger system works, similar to n8n's trigger nodes.

## Overview

The trigger system allows workflows to be automatically started when external events occur (like receiving an email). This is implemented through:

1. **Trigger Actions**: Special actions that can start workflows
2. **Trigger Registry**: Tracks which workflows are listening to which triggers
3. **Webhook Endpoints**: Receive external events and fire triggers
4. **Automatic Registration**: Workflows with trigger nodes are automatically registered when activated

## Architecture

### Components

1. **`WorkflowTriggerRegistry`**: Manages active trigger registrations
   - Registers workflows with trigger nodes
   - Fires triggers when events occur
   - Executes all matching workflows

2. **Trigger Actions**: Extend `IAction` and implement `ITrigger`
   - Must have `isTrigger: true`
   - Must specify `triggerType` (WEBHOOK, EVENT, SCHEDULED, etc.)
   - Example: `ReceiveEmailTrigger` for Gmail

3. **Webhook Controller**: Receives external events
   - `/api/webhooks/gmail` - Receives Gmail push notifications
   - `/api/webhooks/test/gmail` - Test endpoint for development

4. **Workflow Service Integration**: Automatically registers/unregisters triggers
   - When a workflow is activated, trigger nodes are registered
   - When deactivated, triggers are unregistered

## How It Works

### 1. Creating a Workflow with a Trigger

When you create a workflow with a trigger node as the first node:

```json
{
  "nodes": [
    {
      "id": "trigger_1",
      "type": "gmail:gmail_receive_email",
      "config": {
        "from": "important@example.com"
      }
    },
    {
      "id": "action_1",
      "type": "gmail:gmail_send_email",
      "config": {
        "to": "{{from}}",
        "subject": "Re: {{subject}}",
        "body": "I received your email!"
      }
    }
  ],
  "connections": {
    "trigger_1": [{ "node": "action_1", "input": 0, "output": 0 }]
  }
}
```

### 2. Activating the Workflow

When you activate the workflow (`POST /api/workflows/:id/activate`):

1. The system identifies trigger nodes (nodes with no incoming connections)
2. For each trigger node, it finds the corresponding trigger action
3. Registers the workflow with the trigger registry
4. The workflow is now listening for events

### 3. Receiving an Event

When a Gmail webhook is received (`POST /api/webhooks/gmail`):

1. The webhook controller receives the email data
2. Calls `triggerRegistry.fireTrigger()` with the trigger ID and data
3. The registry finds all workflows registered for that trigger
4. Executes each matching workflow with the trigger data
5. The trigger data is passed to the trigger node, which then flows to connected nodes

### 4. Workflow Execution

The workflow execution service:
- Receives trigger data as `inputData`
- Passes it to nodes with no incoming connections (trigger nodes)
- Trigger nodes process the data and pass it to connected nodes
- The workflow continues normally

## Example: Gmail Receive Email Trigger

### Trigger Implementation

The `ReceiveEmailTrigger` is a trigger action that:
- Has `isTrigger: true` and `triggerType: TriggerType.EVENT`
- Defines input/output schemas for email data
- Can filter emails by sender, subject, labels, etc.

### Setting Up Gmail Webhooks

To receive Gmail push notifications, you need to:

1. **Set up Google Cloud Pub/Sub** (recommended for production):
   - Create a Pub/Sub topic
   - Configure Gmail to send push notifications to the topic
   - Set up a subscription that forwards to your webhook endpoint

2. **Or use polling** (simpler, but less efficient):
   - Periodically check for new emails
   - Fire triggers when new emails are found

3. **Or use the test endpoint** (for development):
   ```bash
   curl -X POST http://localhost:8080/api/webhooks/test/gmail \
     -H "Content-Type: application/json" \
     -d '{
       "messageId": "test_123",
       "from": "sender@example.com",
       "subject": "Test Email",
       "body": "This is a test"
     }'
   ```

### Webhook Payload Format

The Gmail webhook expects:

```json
{
  "messageId": "gmail_message_id",
  "threadId": "gmail_thread_id",
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Plain text body",
  "htmlBody": "<p>HTML body</p>",
  "date": "2024-01-01T00:00:00Z",
  "snippet": "Email snippet",
  "attachments": [
    {
      "filename": "file.pdf",
      "mimeType": "application/pdf",
      "size": 12345,
      "attachmentId": "attachment_id"
    }
  ],
  "userId": "optional_user_id_to_filter"
}
```

## Adding New Triggers

To add a new trigger (e.g., for Slack messages):

1. **Create the trigger action**:
   ```typescript
   export class ReceiveSlackMessageTrigger implements ITrigger {
     public readonly id = "slack_receive_message";
     public readonly isTrigger = true as const;
     public readonly triggerType = TriggerType.WEBHOOK;
     // ... implement ITrigger interface
   }
   ```

2. **Add it to your service**:
   ```typescript
   export class SlackService extends BaseService {
     constructor() {
       const config: IServiceConfig = {
         // ...
         actions: [
           new ReceiveSlackMessageTrigger(),
           // ... other actions
         ],
       };
       super(config);
     }
   }
   ```

3. **Create a webhook endpoint**:
   ```typescript
   @Post("slack")
   async handleSlackWebhook(@Body() payload: SlackWebhookPayload) {
     await this.triggerRegistry.fireTrigger(
       "slack_receive_message",
       ServiceProvider.SLACK,
       payload,
     );
   }
   ```

4. **Update the action type enum** (if needed):
   ```typescript
   export enum ActionType {
     // ...
     RECEIVE_SLACK_MESSAGE = "receive_slack_message",
   }
   ```

## Key Points

- **Triggers are automatically registered** when workflows are activated
- **Multiple workflows** can listen to the same trigger
- **Trigger data flows** through the workflow as input to subsequent nodes
- **Workflows must be active** (`isActive: true`) to receive trigger events
- **Triggers are unregistered** when workflows are deactivated or deleted

## Testing

Use the test endpoint to simulate trigger events:

```bash
# Test Gmail webhook
curl -X POST http://localhost:8080/api/webhooks/test/gmail \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "test_123",
    "from": "test@example.com",
    "subject": "Test",
    "body": "Test body"
  }'
```

This will trigger all active workflows that have the `gmail_receive_email` trigger node.


