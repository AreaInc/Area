export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export interface IAction {
  id: string;
  name: string;
  description: string;
  serviceProvider: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  requiresCredentials: boolean;
  validateInput(config: Record<string, any>): Promise<boolean>;
  getMetadata(): ActionMetadata;
}

export interface ActionMetadata {
  id: string;
  name: string;
  description: string;
  serviceProvider: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  requiresCredentials: boolean;
}
