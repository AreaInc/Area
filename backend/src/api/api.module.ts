import { Module } from "@nestjs/common";
import { WorkflowsV2Controller } from "./controllers/workflows-v2.controller";
import { UsersController } from "./controllers/users.controller";
import { OAuth2CredentialController } from "./controllers/oauth2-credential.controller";
import { GmailWebhookController } from "./controllers/gmail-webhook.controller";
import { OAuth2Module } from "../services/oauth2/oauth2.module";
import { WorkflowsModule } from "../services/workflows/workflows.module";
import { GmailModule } from "../services/gmail/gmail.module";

@Module({
  imports: [OAuth2Module, WorkflowsModule, GmailModule],
  controllers: [
    WorkflowsV2Controller,
    UsersController,
    OAuth2CredentialController,
    GmailWebhookController,
  ],
})
export class ApiModule {}
