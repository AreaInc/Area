CREATE TYPE "public"."action_type" AS ENUM('send_email', 'read_email', 'create_document', 'send_message', 'create_issue', 'create_task', 'update_status', 'trigger_webhook');--> statement-breakpoint
CREATE TYPE "public"."credential_type" AS ENUM('oauth2', 'api_key', 'basic_auth', 'bearer_token', 'custom');--> statement-breakpoint
CREATE TYPE "public"."service_provider" AS ENUM('gmail', 'google', 'slack', 'discord', 'github', 'trello', 'notion');--> statement-breakpoint
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
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "action_executions" ADD CONSTRAINT "action_executions_credentials_id_credentials_id_fk" FOREIGN KEY ("credentials_id") REFERENCES "public"."credentials"("id") ON DELETE no action ON UPDATE no action;