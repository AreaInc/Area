import { Injectable } from "@nestjs/common";
import { BaseService } from "../common/base/base-service";
import { ServiceProvider } from "../common/types/enums";

@Injectable()
export class ServiceRegistry {
  private services: Map<ServiceProvider, BaseService> = new Map();

  register(service: BaseService): void {
    const provider = service.getProvider();
    this.services.set(provider, service);
  }

  get(provider: ServiceProvider): BaseService | undefined {
    return this.services.get(provider);
  }

  getAll(): BaseService[] {
    return Array.from(this.services.values());
  }

  getProviders(): ServiceProvider[] {
    return Array.from(this.services.keys());
  }

  has(provider: ServiceProvider): boolean {
    return this.services.has(provider);
  }

  unregister(provider: ServiceProvider): boolean {
    return this.services.delete(provider);
  }

  clear(): void {
    this.services.clear();
  }
}
