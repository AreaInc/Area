import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Workflow,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowExecution,
  TriggerMetadata,
  ActionMetadata,
} from '../types/workflow';

const API_BASE = `http://${import.meta.env.VITE_DEPLOY_ADDRESS ?? "localhost"}:8080/api`

export function useWorkflows() {
  return useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/workflows`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }

      return response.json();
    },
  });
}

export function useWorkflow(id: number) {
  return useQuery<Workflow>({
    queryKey: ['workflows', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/workflows/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workflow');
      }

      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateWorkflowDto) => {
      const response = await fetch(`${API_BASE}/v2/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Failed to create workflow (${response.status})`;
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateWorkflowDto }) => {
      const response = await fetch(`${API_BASE}/v2/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/v2/workflows/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useActivateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/v2/workflows/${id}/activate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to activate workflow');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useDeactivateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/v2/workflows/${id}/deactivate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate workflow');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useExecuteWorkflow() {
  return useMutation({
    mutationFn: async ({ id, triggerData }: { id: number; triggerData?: Record<string, any> }) => {
      const response = await fetch(`${API_BASE}/v2/workflows/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerData }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }

      return response.json();
    },
  });
}

export function useWorkflowExecutions(workflowId: number) {
  return useQuery<WorkflowExecution[]>({
    queryKey: ['workflows', workflowId, 'executions'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/workflows/${workflowId}/executions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workflow executions');
      }

      return response.json();
    },
    enabled: !!workflowId,
  });
}

export function useTriggers() {
  return useQuery<TriggerMetadata[]>({
    queryKey: ['triggers'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/workflows/metadata/triggers`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch triggers');
      }

      return response.json();
    },
  });
}

export function useActions() {
  return useQuery<ActionMetadata[]>({
    queryKey: ['actions'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/workflows/metadata/actions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch actions');
      }

      return response.json();
    },
  });
}
