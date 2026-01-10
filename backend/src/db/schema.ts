import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
  boolean,
  varchar,
  pgEnum,
  integer,
  unique,
} from "drizzle-orm/pg-core";

export const serviceProviderEnum = pgEnum("service_provider", [
  "gmail",
  "google",
  "slack",
  "discord",
  "github",
  "trello",
  "notion",
]);

export const credentialTypeEnum = pgEnum("credential_type", [
  "oauth2",
  "api_key",
  "basic_auth",
  "bearer_token",
  "custom",
]);

export const actionTypeEnum = pgEnum("action_type", [
  "send_email",
  "read_email",
  "create_document",
  "send_message",
  "create_issue",
  "create_task",
  "update_status",
  "trigger_webhook",
  "receive_email",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  serviceProvider: serviceProviderEnum("service_provider").notNull(),
  type: credentialTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  // OAuth2 specific fields (encrypted)
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  // OAuth2 app credentials (encrypted)
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  // Legacy field for backward compatibility
  data: jsonb("data"),
  isValid: boolean("is_valid").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceActions = pgTable(
  "service_actions",
  {
    id: serial("id").primaryKey(),
    serviceProvider: serviceProviderEnum("service_provider").notNull(),
    actionId: varchar("action_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: actionTypeEnum("type").notNull(),
    inputSchema: jsonb("input_schema").notNull(),
    outputSchema: jsonb("output_schema"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueServiceAction: unique().on(table.serviceProvider, table.actionId),
  }),
);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  provider: serviceProviderEnum("provider").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  version: varchar("version", { length: 50 }).notNull(),
  supportedActions: jsonb("supported_actions").notNull(),
  credentialTypes: jsonb("credential_types").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const actionExecutions = pgTable("action_executions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  serviceProvider: serviceProviderEnum("service_provider").notNull(),
  actionId: varchar("action_id", { length: 255 }).notNull(),
  credentialsId: integer("credentials_id").references(() => credentials.id),
  status: varchar("status", { length: 50 }).notNull(),
  inputParams: jsonb("input_params"),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Trigger configuration (ONE trigger)
  triggerProvider: serviceProviderEnum("trigger_provider").notNull(),
  triggerId: varchar("trigger_id", { length: 100 }).notNull(),
  triggerConfig: jsonb("trigger_config").notNull().default('{}'),
  // Action configuration (ONE action)
  actionProvider: serviceProviderEnum("action_provider").notNull(),
  actionId: varchar("action_id", { length: 100 }).notNull(),
  actionConfig: jsonb("action_config").notNull().default('{}'),
  actionCredentialsId: integer("action_credentials_id").references(() => credentials.id),
  isActive: boolean("is_active").default(false).notNull(),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id")
    .notNull()
    .references(() => workflows.id),
  userId: text("user_id").notNull(),
  // Temporal workflow info
  temporalWorkflowId: varchar("temporal_workflow_id", { length: 255 }).notNull(),
  temporalRunId: varchar("temporal_run_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  triggerData: jsonb("trigger_data"),
  actionResult: jsonb("action_result"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
