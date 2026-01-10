import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { CacheInterceptor, CacheKey, CacheTTL } from "@nestjs/cache-manager";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { TriggerRegistryService } from "./services/registries/trigger-registry.service";
import { ActionRegistryService } from "./services/registries/action-registry.service";

@Controller()
export class AppController {
  constructor(
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly actionRegistry: ActionRegistryService,
  ) {}

  @Get("about.json")
  @AllowAnonymous()
  @UseInterceptors(CacheInterceptor)
  @CacheKey("about.json")
  @CacheTTL(60)
  async getAbout() {
    const currentTime = Math.floor(Date.now() / 1000);

    const triggers = this.triggerRegistry.getAllMetadata();
    const actions = this.actionRegistry.getAllMetadata();

    const servicesMap = new Map<string, { actions: any[]; reactions: any[] }>();

    triggers.forEach((trigger) => {
      if (!servicesMap.has(trigger.serviceProvider)) {
        servicesMap.set(trigger.serviceProvider, { actions: [], reactions: [] });
      }
      servicesMap.get(trigger.serviceProvider)!.actions.push({
        name: trigger.id.toLowerCase().replace(/\s+/g, "_"),
        description: trigger.description,
      });
    });

    actions.forEach((action) => {
      if (!servicesMap.has(action.serviceProvider)) {
        servicesMap.set(action.serviceProvider, { actions: [], reactions: [] });
      }
      servicesMap.get(action.serviceProvider)!.reactions.push({
        name: action.id.toLowerCase().replace(/\s+/g, "_"),
        description: action.description,
      });
    });

    const servicesList = Array.from(servicesMap.entries()).map(([name, data]) => ({
      name: name.toLowerCase(),
      actions: data.actions,
      reactions: data.reactions,
    }));

    return {
      client: {
        host: "0.0.0.0",
      },
      server: {
        current_time: currentTime,
        services: servicesList,
      },
    };
  }
}
