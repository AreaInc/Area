import * as _tanstack_react_query from '@tanstack/react-query';

declare const API_BASE = "http://localhost:8080/api";

interface Credential {
    id: number;
    name: string;
    serviceProvider: string;
    credentialType: string;
    isValid: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface CreateCredentialDto {
    name: string;
    provider: string;
    clientId: string;
    clientSecret: string;
}

declare function useCredentials(): _tanstack_react_query.UseQueryResult<Credential[], Error>;
declare function useCredential(credentialId: number): _tanstack_react_query.UseQueryResult<Credential, Error>;
declare function useCreateCredential(): _tanstack_react_query.UseMutationResult<any, Error, CreateCredentialDto, unknown>;
declare function useDeleteCredential(): _tanstack_react_query.UseMutationResult<any, Error, number, unknown>;
declare function useInitiateOAuth(credentialId: number, redirectUrl?: string): string;
declare function getOAuthCallbackUrl(): string;

interface Action {
    id: string;
    name: string;
    description: string;
    type: string;
    inputSchema: Record<string, any>;
    outputSchema?: Record<string, any>;
}
interface Service {
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

declare function useServices(): {
    services: Service[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
};
declare function useService(provider: string): {
    service: Service | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
};

interface TriggerConfig {
    provider: string;
    triggerId: string;
    config: Record<string, any>;
}
interface ActionConfig {
    provider: string;
    actionId: string;
    config: Record<string, any>;
    credentialsId?: number;
}
interface Workflow {
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
interface CreateWorkflowDto {
    name: string;
    description?: string;
    trigger: TriggerConfig;
    action: ActionConfig;
}
interface UpdateWorkflowDto {
    name?: string;
    description?: string;
    trigger?: TriggerConfig;
    action?: ActionConfig;
}
interface WorkflowExecution {
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
interface TriggerMetadata {
    id: string;
    name: string;
    description: string;
    serviceProvider: string;
    triggerType: string;
    configSchema: Record<string, any>;
    outputSchema?: Record<string, any>;
    requiresCredentials: boolean;
}
interface ActionMetadata {
    id: string;
    name: string;
    description: string;
    serviceProvider: string;
    inputSchema: Record<string, any>;
    outputSchema?: Record<string, any>;
    requiresCredentials: boolean;
}
type WorkflowSummary = Pick<Workflow, 'id' | 'name' | 'isActive' | 'lastRun' | 'description'>;

declare function useWorkflows(): _tanstack_react_query.UseQueryResult<Workflow[], Error>;
declare function useWorkflow(id: number): _tanstack_react_query.UseQueryResult<Workflow, Error>;
declare function useCreateWorkflow(): _tanstack_react_query.UseMutationResult<any, Error, CreateWorkflowDto, unknown>;
declare function useUpdateWorkflow(): _tanstack_react_query.UseMutationResult<any, Error, {
    id: number;
    dto: UpdateWorkflowDto;
}, unknown>;
declare function useDeleteWorkflow(): _tanstack_react_query.UseMutationResult<any, Error, number, unknown>;
declare function useActivateWorkflow(): _tanstack_react_query.UseMutationResult<any, Error, number, unknown>;
declare function useDeactivateWorkflow(): _tanstack_react_query.UseMutationResult<any, Error, number, unknown>;
declare function useExecuteWorkflow(): _tanstack_react_query.UseMutationResult<any, Error, {
    id: number;
    triggerData?: Record<string, any>;
}, unknown>;
declare function useWorkflowExecutions(workflowId: number): _tanstack_react_query.UseQueryResult<WorkflowExecution[], Error>;
declare function useTriggers(): _tanstack_react_query.UseQueryResult<TriggerMetadata[], Error>;
declare function useActions(): _tanstack_react_query.UseQueryResult<ActionMetadata[], Error>;

export { API_BASE, type Action, type ActionConfig, type ActionMetadata, type CreateCredentialDto, type CreateWorkflowDto, type Credential, type Service, type TriggerConfig, type TriggerMetadata, type UpdateWorkflowDto, type Workflow, type WorkflowExecution, type WorkflowSummary, getOAuthCallbackUrl, useActions, useActivateWorkflow, useCreateCredential, useCreateWorkflow, useCredential, useCredentials, useDeactivateWorkflow, useDeleteCredential, useDeleteWorkflow, useExecuteWorkflow, useInitiateOAuth, useService, useServices, useTriggers, useUpdateWorkflow, useWorkflow, useWorkflowExecutions, useWorkflows };
