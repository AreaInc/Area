ALTER TABLE "credentials" ALTER COLUMN "data" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "client_secret" text;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD COLUMN "temporal_workflow_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD COLUMN "temporal_run_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD COLUMN "trigger_data" jsonb;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD COLUMN "action_result" jsonb;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "trigger_provider" "service_provider" NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "trigger_id" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "trigger_config" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "action_provider" "service_provider" NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "action_id" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "action_config" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "action_credentials_id" integer;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_action_credentials_id_credentials_id_fk" FOREIGN KEY ("action_credentials_id") REFERENCES "public"."credentials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" DROP COLUMN "input_data";--> statement-breakpoint
ALTER TABLE "workflow_executions" DROP COLUMN "output_data";--> statement-breakpoint
ALTER TABLE "workflow_executions" DROP COLUMN "node_results";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "nodes";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "connections";