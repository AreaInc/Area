import { Injectable } from "@nestjs/common";
import { IAction, ActionMetadata } from "../../common/types/action.interface";

@Injectable()
export class ActionRegistryService {
  private actions = new Map<string, IAction>();

  register(action: IAction): void {
    const key = `${action.serviceProvider}:${action.id}`;
    this.actions.set(key, action);
  }

  get(serviceProvider: string, actionId: string): IAction | undefined {
    const key = `${serviceProvider}:${actionId}`;
    return this.actions.get(key);
  }

  getAll(): IAction[] {
    return Array.from(this.actions.values());
  }

  getByProvider(serviceProvider: string): IAction[] {
    return Array.from(this.actions.values()).filter(
      (action) => action.serviceProvider === serviceProvider,
    );
  }

  getMetadata(
    serviceProvider: string,
    actionId: string,
  ): ActionMetadata | undefined {
    const action = this.get(serviceProvider, actionId);
    return action?.getMetadata();
  }

  getAllMetadata(): ActionMetadata[] {
    return this.getAll().map((action) => action.getMetadata());
  }

  has(serviceProvider: string, actionId: string): boolean {
    const key = `${serviceProvider}:${actionId}`;
    return this.actions.has(key);
  }

  unregister(serviceProvider: string, actionId: string): void {
    const key = `${serviceProvider}:${actionId}`;
    this.actions.delete(key);
  }
}
