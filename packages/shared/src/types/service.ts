export interface Action {
  id: string;
  name: string;
  description: string;
  type: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  serviceProvider?: string;
  serviceImageUrl?: string | null;
}

export interface Trigger {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  configSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  requiresCredentials: boolean;
  serviceProvider?: string;
  serviceImageUrl?: string | null;
}

export interface Service {
  id: number;
  provider: string;
  name: string;
  description: string;
  imageUrl: string;
  version: string;
  supportedActions: string[];
  credentialTypes: string[];
  actions: Action[];
  triggers: Trigger[];
}
