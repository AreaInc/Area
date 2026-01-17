import { Module, Global } from "@nestjs/common";
import { ActionRegistryService } from "./action-registry.service";
import { TriggerRegistryService } from "./trigger-registry.service";

@Global()
@Module({
  providers: [ActionRegistryService, TriggerRegistryService],
  exports: [ActionRegistryService, TriggerRegistryService],
})
export class RegistriesModule {}
