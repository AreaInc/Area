import { Injectable } from "@nestjs/common";
import {
  ITrigger,
  TriggerMetadata,
} from "../../common/types/trigger.interface";

@Injectable()
export class TriggerRegistryService {
  private triggers = new Map<string, ITrigger>();

  register(trigger: ITrigger): void {
    const key = `${trigger.serviceProvider}:${trigger.id}`;
    this.triggers.set(key, trigger);
  }

  get(serviceProvider: string, triggerId: string): ITrigger | undefined {
    const key = `${serviceProvider}:${triggerId}`;
    return this.triggers.get(key);
  }

  getAll(): ITrigger[] {
    return Array.from(this.triggers.values());
  }

  getByProvider(serviceProvider: string): ITrigger[] {
    return Array.from(this.triggers.values()).filter(
      (trigger) => trigger.serviceProvider === serviceProvider,
    );
  }

  getMetadata(
    serviceProvider: string,
    triggerId: string,
  ): TriggerMetadata | undefined {
    const trigger = this.get(serviceProvider, triggerId);
    if (!trigger) return undefined;

    return {
      id: trigger.id,
      name: trigger.name,
      description: trigger.description,
      serviceProvider: trigger.serviceProvider,
      triggerType: trigger.triggerType,
      configSchema: trigger.configSchema,
      outputSchema: trigger.outputSchema,
      requiresCredentials: trigger.requiresCredentials,
    };
  }

  getAllMetadata(): TriggerMetadata[] {
    return this.getAll().map((trigger) => ({
      id: trigger.id,
      name: trigger.name,
      description: trigger.description,
      serviceProvider: trigger.serviceProvider,
      triggerType: trigger.triggerType,
      configSchema: trigger.configSchema,
      outputSchema: trigger.outputSchema,
      requiresCredentials: trigger.requiresCredentials,
    }));
  }

  has(serviceProvider: string, triggerId: string): boolean {
    const key = `${serviceProvider}:${triggerId}`;
    return this.triggers.has(key);
  }

  unregister(serviceProvider: string, triggerId: string): void {
    const key = `${serviceProvider}:${triggerId}`;
    this.triggers.delete(key);
  }
}
