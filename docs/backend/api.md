# API Reference

> **REST API Endpoints for the AREA Platform.**

Base URL: `http://localhost:8080` (default)
Authentication (JWT) is required for most endpoints via the `Authorization: Bearer <token>` header.

## Authentication

### `GET /auth/:provider`
Starts the OAuth2 authorization flow for a specific provider.

- **Parameters**: `provider` (string) - google, spotify, discord, etc.
- **Response**: Redirects to the provider's login page.

### `GET /auth/:provider/callback`
Handles the redirect from the provider.

- **Query Params**: `code` (string) - The authorization code.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Successfully connected google"
  }
  ```

### `GET /oauth2/credentials`
List all connected accounts.

- **Response**: Array of connected credentials.
  ```json
  [
    {
      "id": 1,
      "serviceProvider": "spotify",
      "name": "User Name",
      "isValid": true,
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
  ```

### `DELETE /oauth2/credentials/:id`
Remove a connected account.

- **Parameters**: `id` (number) - The credential ID.
- **Response**: `204 No Content`

## Workflows (AREAs)

### `GET /workflows`
List all user workflows.

- **Response**: Array of `WorkflowResponse` objects.

### `GET /workflows/:id`
Get details of a single workflow.

- **Parameters**: `id` (number)
- **Response**: `WorkflowResponse` object.

### `POST /workflows`
Create a new automation workflow.

- **Request Body**:
  ```json
  {
    "name": "Sync Spotify to Discord",
    "description": "Post my new liked songs to a discord channel",
    "trigger": {
      "provider": "spotify",
      "triggerId": "new_liked_song",
      "config": {}
    },
    "action": {
      "provider": "discord",
      "actionId": "send_webhook",
      "config": {
        "webhookUrl": "https://discord.com/api/webhooks/..."
      }
    }
  }
  ```

- **Response**: `201 Created` with the created `WorkflowResponse`.

### `PATCH /workflows/:id`
Update a workflow or toggle its active state.

- **Parameters**: `id` (number)
- **Request Body** (Partial):
  ```json
  {
    "isActive": true
  }
  ```
  *or*
  ```json
  {
     "name": "New Name",
     "trigger": { ... }
  }
  ```

### `DELETE /workflows/:id`
Delete a workflow.

- **Response**: `200 OK`

---

## Services

### `GET /services`
List all supported services.

- **Response**:
  ```json
  [
    {
      "id": "spotify",
      "name": "Spotify",
      "description": "Music Integration",
      "imageUrl": "..."
    }
  ]
  ```

### `GET /services/:id/triggers`
Get available triggers for a service with their configuration schema.

- **Parameters**: `id` (string) - e.g., 'spotify'
- **Response**:
  ```json
  [
    {
        "id": "new_track_played",
        "name": "New Track Played",
        "description": "Triggers when a new track is played",
        "configSchema": { "type": "object", "properties": {} },
        "requiresCredentials": true
    }
  ]
  ```

### `GET /services/:id/actions`
Get available actions for a service.

- **Response**: Similar format to triggers, but with `inputSchema`.

---

## Users

### `GET /users/me`
Get the current authenticated user's profile.

- **Response**:
  ```json
  {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "..."
  }
  ```

### `PATCH /users/me`
Update user profile.

- **Request Body**:
  ```json
  {
    "name": "New Name"
  }
  ```

---

## Error Handling

The API returns standard HTTP status codes. Errors are formatted as follows:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Status Codes

| Code | Description | Example Scenario |
| :--- | :--- | :--- |
| **200** | OK | Request succeeded. |
| **201** | Created | Resource successfully created (e.g., POST /workflows). |
| **204** | No Content | Resource successfully deleted. |
| **400** | Bad Request | Invalid payload or missing required fields. |
| **401** | Unauthorized | Missing or invalid Bearer token. |
| **403** | Forbidden | User does not have permission to access this resource. |
| **404** | Not Found | The requested resource (workflow, credential) does not exist. |
| **500** | Internal Server Error | Something went wrong on the backend. Check server logs. |
