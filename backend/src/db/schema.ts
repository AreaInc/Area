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
import {
  ServiceProvider,
  CredentialType,
  ActionType,
} from "../common/types/enums";

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
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  serviceProvider: serviceProviderEnum("service_provider").notNull(),
  type: credentialTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  data: jsonb("data").notNull(),
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
