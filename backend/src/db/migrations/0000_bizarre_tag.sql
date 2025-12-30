CREATE TYPE "public"."action_type" AS ENUM('send_email', 'read_email', 'create_document', 'send_message', 'create_issue', 'create_task', 'update_status', 'trigger_webhook', 'receive_email');--> statement-breakpoint
CREATE TYPE "public"."credential_type" AS ENUM('oauth2', 'api_key', 'basic_auth', 'bearer_token', 'custom');--> statement-breakpoint
CREATE TYPE "public"."service_provider" AS ENUM('gmail', 'google', 'slack', 'discord', 'github', 'trello', 'notion');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"service_provider" "service_provider" NOT NULL,
	"action_id" varchar(255) NOT NULL,
	"credentials_id" integer,
	"status" varchar(50) NOT NULL,
	"input_params" jsonb,
	"output_data" jsonb,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"service_provider" "service_provider" NOT NULL,
	"type" "credential_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"data" jsonb NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_provider" "service_provider" NOT NULL,
	"action_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "action_type" NOT NULL,
	"input_schema" jsonb NOT NULL,
	"output_schema" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_actions_service_provider_action_id_unique" UNIQUE("service_provider","action_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" "service_provider" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" text,
	"version" varchar(50) NOT NULL,
	"supported_actions" jsonb NOT NULL,
	"credential_types" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "services_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"input_data" jsonb,
	"output_data" jsonb,
	"node_results" jsonb,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"nodes" jsonb NOT NULL,
	"connections" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"last_run" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_executions" ADD CONSTRAINT "action_executions_credentials_id_credentials_id_fk" FOREIGN KEY ("credentials_id") REFERENCES "public"."credentials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;