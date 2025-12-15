import { Module } from "@nestjs/common";
import { ServicesController } from "./controllers/services.controller";
import { CredentialsController } from "./controllers/credentials.controller";
import { ServiceAuthController } from "./controllers/service-auth.controller";
import { ActionsController } from "./controllers/actions.controller";
import { WorkflowsController } from "./controllers/workflows.controller";
import { UsersController } from "./controllers/users.controller";
import { WebhooksController } from "./controllers/webhooks.controller";
import { ServicesModule } from "../services/services-module";

@Module({
  imports: [ServicesModule],
  controllers: [
    ServicesController,
    CredentialsController,
    ServiceAuthController,
    ActionsController,
    WorkflowsController,
    UsersController,
    WebhooksController,
  ],
})
export class ApiModule {}
