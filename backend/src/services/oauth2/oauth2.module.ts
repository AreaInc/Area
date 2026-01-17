import { Module } from "@nestjs/common";
import { OAuth2Service } from "./oauth2.service";
import { DrizzleModule } from "../../db/drizzle.module";
import { WorkflowsModule } from "../workflows/workflows.module";

@Module({
  imports: [DrizzleModule, WorkflowsModule],
  providers: [OAuth2Service],
  exports: [OAuth2Service],
})
export class OAuth2Module {}
