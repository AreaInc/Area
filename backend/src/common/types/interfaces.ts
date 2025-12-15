import {
  ActionType,
  ServiceProvider,
  CredentialType,
  ExecutionStatus,
  TriggerType,
} from "./enums";

export interface IAction {
  id: string;
  name: string;
  description: string;
  type: ActionType;
  serviceProvider: ServiceProvider;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  execute: (
    params: ActionParams,
    credentials: ICredentials,
  ) => Promise<ActionResult>;
}

export interface ActionParams {
  [key: string]: any;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  status: ExecutionStatus;
}

export interface ICredentials {
  id?: string;
  userId: string;
  serviceProvider: ServiceProvider;
  type: CredentialType;
  name: string;
  data: Record<string, any>;
  isValid: () => Promise<boolean>;
  refresh?: () => Promise<void>;
}

export interface IServiceMetadata {
  provider: ServiceProvider;
  name: string;
  description: string;
  imageUrl?: string;
  version: string;
  supportedActions: ActionType[];
  credentialTypes: CredentialType[];
}

export interface IServiceConfig {
  metadata: IServiceMetadata;
  actions: IAction[];
  defaultCredentials?: ICredentials;
}

export interface ITrigger extends IAction {
  isTrigger: true;
  triggerType: TriggerType;
}

export interface TriggerEvent {
  triggerId: string;
  serviceProvider: ServiceProvider;
  data: Record<string, any>;
  userId?: string;
  credentialsId?: string;
}
