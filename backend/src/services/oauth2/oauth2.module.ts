import { Module } from "@nestjs/common";
import { OAuth2Service } from "./oauth2.service";
import { DrizzleModule } from "../../db/drizzle.module";

@Module({
  imports: [DrizzleModule],
  providers: [OAuth2Service],
  exports: [OAuth2Service],
})
export class OAuth2Module {}
