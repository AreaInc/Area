import { Module } from "@nestjs/common";
import { ServicesService } from "./services.service";
import { DrizzleModule } from "../../db/drizzle.module";

@Module({
  imports: [DrizzleModule],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
