export enum TriggerType {
  MANUAL = "manual",
  SCHEDULED = "scheduled",
  WEBHOOK = "webhook",
  EVENT = "event",
  POLLING = "polling",
}

export interface ITrigger {
  id: string;
  name: string;
  description: string;
  serviceProvider: string;
  triggerType: TriggerType;
  configSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  requiresCredentials: boolean;
  register(
    workflowId: number,
    config: Record<string, any>,
    credentialsId?: number,
  ): Promise<void>;
  unregister(workflowId: number): Promise<void>;
  validateConfig(config: Record<string, any>): Promise<boolean>;
}

export interface TriggerMetadata {
  id: string;
  name: string;
  description: string;
  serviceProvider: string;
  triggerType: TriggerType;
  configSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  requiresCredentials: boolean;
}
