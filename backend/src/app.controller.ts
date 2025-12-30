import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { CacheInterceptor, CacheKey, CacheTTL } from "@nestjs/cache-manager";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { ServiceRegistry } from "./services/service-registry";
import { ServicesService } from "./services/services-service";
import { ServiceProvider } from "./common/types/enums";
import { IAction, ITrigger } from "./common/types/interfaces";

@Controller()
export class AppController {
  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private readonly servicesService: ServicesService,
  ) {}

  @Get("about.json")
  @AllowAnonymous()
  @UseInterceptors(CacheInterceptor)
  @CacheKey("about.json")
  @CacheTTL(60)
  async getAbout() {
    const currentTime = Math.floor(Date.now() / 1000);

    const services = await this.servicesService.getAllServices();
    const servicesList = services.map((service) => {
      const serviceInstance = this.serviceRegistry.get(
        service.provider as ServiceProvider,
      );
      const allActions = serviceInstance?.getActions() || [];

      const actions = allActions
        .filter((action) => this.isTriggerAction(action))
        .map((action) => ({
          name: action.name.toLowerCase().replace(/\s+/g, "_"),
          description: action.description,
        }));

      const reactions = allActions
        .filter((action) => !this.isTriggerAction(action))
        .map((action) => ({
          name: action.name.toLowerCase().replace(/\s+/g, "_"),
          description: action.description,
        }));

      return {
        name: service.name.toLowerCase(),
        actions,
        reactions,
      };
    });

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

  private isTriggerAction(action: IAction): action is ITrigger {
    // Check if the action implements ITrigger interface
    return "isTrigger" in action && (action as ITrigger).isTrigger === true;
  }
}
