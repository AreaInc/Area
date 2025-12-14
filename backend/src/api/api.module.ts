import { Module } from "@nestjs/common";
import { ServicesController } from "./controllers/services.controller";
import { CredentialsController } from "./controllers/credentials.controller";
import { ActionsController } from "./controllers/actions.controller";
import { ServicesModule } from "../services/services-module";

@Module({
  imports: [ServicesModule],
  controllers: [ServicesController, CredentialsController, ActionsController],
})
export class ApiModule {}
