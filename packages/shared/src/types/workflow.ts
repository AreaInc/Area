export interface TriggerConfig {
  provider: string;
  triggerId: string;
  config: Record<string, any>;
}

export interface ActionConfig {
  provider: string;
  actionId: string;
  config: Record<string, any>;
  credentialsId?: number;
}

export interface Workflow {
  id: number;
  userId: string;
  name: string;
  description?: string | null;
  triggerProvider: string;
  triggerId: string;
  triggerConfig: Record<string, any>;
  actionProvider: string;
  actionId: string;
  actionConfig: Record<string, any>;
  actionCredentialsId?: number | null;
  isActive: boolean;
  lastRun?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  trigger: TriggerConfig;
  action: ActionConfig;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  trigger?: TriggerConfig;
  action?: ActionConfig;
}

export interface WorkflowExecution {
  id: number;
  workflowId: number;
  userId: string;
  temporalWorkflowId: string;
  temporalRunId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  triggerData?: Record<string, any> | null;
  actionResult?: Record<string, any> | null;
  errorMessage?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
}

export interface TriggerMetadata {
  id: string;
  name: string;
  description: string;
  serviceProvider: string;
  triggerType: string;
  configSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  requiresCredentials: boolean;
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

export type WorkflowSummary = Pick<Workflow, 'id' | 'name' | 'isActive' | 'lastRun' | 'description'>;
