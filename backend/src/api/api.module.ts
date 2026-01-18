import { Module } from "@nestjs/common";
import { WorkflowsV2Controller } from "./controllers/workflows-v2.controller";
import { TriggersController } from "./controllers/triggers.controller";
import { ActionsController } from "./controllers/actions.controller";
import { UsersController } from "./controllers/users.controller";
import { OAuth2CredentialController } from "./controllers/oauth2-credential.controller";
import { GmailWebhookController } from "./controllers/gmail-webhook.controller";
import { ServicesController } from "./controllers/services.controller";
import { OAuth2Module } from "../services/oauth2/oauth2.module";
import { WorkflowsModule } from "../services/workflows/workflows.module";
import { GmailModule } from "../services/gmail/gmail.module";
import { ServicesModule } from "../services/services/services.module";

@Module({
  imports: [OAuth2Module, WorkflowsModule, GmailModule, ServicesModule],
  controllers: [
    WorkflowsV2Controller,
    TriggersController,
    ActionsController,
    UsersController,
    OAuth2CredentialController,
    GmailWebhookController,
    ServicesController,
  ],
})
export class ApiModule {}
