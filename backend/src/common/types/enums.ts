export enum ServiceProvider {
  GMAIL = "gmail",
  GOOGLE = "google",
  SLACK = "slack",
  DISCORD = "discord",
  GITHUB = "github",
  TRELLO = "trello",
  NOTION = "notion",
  SCHEDULER = "scheduler",
}

export enum ActionType {
  SEND_EMAIL = "send_email",
  READ_EMAIL = "read_email",
  CREATE_DOCUMENT = "create_document",
  SEND_MESSAGE = "send_message",
  CREATE_ISSUE = "create_issue",
  CREATE_TASK = "create_task",
  UPDATE_STATUS = "update_status",
  TRIGGER_WEBHOOK = "trigger_webhook",
  // Trigger types
  RECEIVE_EMAIL = "receive_email",
}

export enum CredentialType {
  OAUTH2 = "oauth2",
  API_KEY = "api_key",
  BASIC_AUTH = "basic_auth",
  BEARER_TOKEN = "bearer_token",
  CUSTOM = "custom",
}

export enum ExecutionStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum TriggerType {
  MANUAL = "manual",
  SCHEDULED = "scheduled",
  WEBHOOK = "webhook",
  EVENT = "event",
}
