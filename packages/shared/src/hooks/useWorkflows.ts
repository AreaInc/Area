import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Workflow,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowExecution,
  TriggerMetadata,
  ActionMetadata,
} from '../types/workflow';
import { getApiBase } from './const';

// Standalone fetch functions (for Mobile / Non-React usage)
export async function fetchWorkflows(): Promise<Workflow[]> {
  const response = await fetch(`${getApiBase()}/v2/workflows`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch workflows');
  return response.json();
}

export async function fetchWorkflow(id: number): Promise<Workflow> {
  const response = await fetch(`${getApiBase()}/v2/workflows/${id}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch workflow');
  return response.json();
}

export async function createWorkflow(dto: CreateWorkflowDto): Promise<Workflow> {
  const response = await fetch(`${getApiBase()}/v2/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create workflow (${response.status})`);
  }
  return response.json();
}

export async function updateWorkflow(id: number, dto: UpdateWorkflowDto): Promise<Workflow> {
  const response = await fetch(`${getApiBase()}/v2/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to update workflow');
  return response.json();
}

export async function deleteWorkflow(id: number): Promise<void> {
  const response = await fetch(`${getApiBase()}/v2/workflows/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to delete workflow');
  return response.json();
}

export async function activateWorkflow(id: number): Promise<Workflow> {
  const response = await fetch(`${getApiBase()}/v2/workflows/${id}/activate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to activate workflow');
  return response.json();
}

export async function deactivateWorkflow(id: number): Promise<Workflow> {
  const response = await fetch(`${getApiBase()}/v2/workflows/${id}/deactivate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to deactivate workflow');
  return response.json();
}

export async function executeWorkflow(id: number, triggerData?: Record<string, any>): Promise<any> {
  const response = await fetch(`${getApiBase()}/v2/workflows/${id}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ triggerData }),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to execute workflow');
  return response.json();
}

export async function fetchWorkflowExecutions(workflowId: number): Promise<WorkflowExecution[]> {
  const response = await fetch(`${getApiBase()}/v2/workflows/${workflowId}/executions`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch workflow executions');
  return response.json();
}

export async function fetchTriggers(): Promise<TriggerMetadata[]> {
  const response = await fetch(`${getApiBase()}/v2/workflows/metadata/triggers`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch triggers');
  return response.json();
}

export async function fetchActions(): Promise<ActionMetadata[]> {
  const response = await fetch(`${getApiBase()}/v2/workflows/metadata/actions`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch actions');
  return response.json();
}

// React Query Hooks (reuse standalone functions)
export function useWorkflows() {
  return useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  });
}

export function useWorkflow(id: number) {
  return useQuery<Workflow>({
    queryKey: ['workflows', id],
    queryFn: () => fetchWorkflow(id),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateWorkflowDto }) => updateWorkflow(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useActivateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useDeactivateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useExecuteWorkflow() {
  return useMutation({
    mutationFn: ({ id, triggerData }: { id: number; triggerData?: Record<string, any> }) =>
      executeWorkflow(id, triggerData),
  });
}

export function useWorkflowExecutions(workflowId: number) {
  return useQuery<WorkflowExecution[]>({
    queryKey: ['workflows', workflowId, 'executions'],
    queryFn: () => fetchWorkflowExecutions(workflowId),
    enabled: !!workflowId,
  });
}

export function useTriggers() {
  return useQuery<TriggerMetadata[]>({
    queryKey: ['triggers'],
    queryFn: fetchTriggers,
  });
}

export function useActions() {
  return useQuery<ActionMetadata[]>({
    queryKey: ['actions'],
    queryFn: fetchActions,
  });
}
