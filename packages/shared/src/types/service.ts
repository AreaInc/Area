export interface Action {
  id: string;
  name: string;
  description: string;
  type: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
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
}
