import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Workflow } from '../types/workflow'

const API_BASE = 'http://localhost:8080/api'

// Helper to get the token, though better-auth likely handles cookies. 
// If using headers, we'd need to intercept requests.
// Assuming better-auth uses cookies which are sent automatically if credentials: 'include'.
// However, the backend is on a different port (8080) than frontend (8081).
// We setup CORS in backend/src/main.ts, so cookies should work if 'credentials: true' is set in fetch.

async function fetchWorkflows(): Promise<Workflow[]> {
  // Better-auth client handles auth, but for custom API calls we might need to use standard fetch with credentials
  // Or we can use the better-auth client's fetch if it exposes one, or just standard fetch with credentials.
  
  // Actually, for better-auth, the session token is usually in a cookie.
  const response = await fetch(`${API_BASE}/workflows`, {
    headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ...` // If using bearer tokens
    },
    credentials: 'include' // Important for cookies
  })

  if (!response.ok) {
    throw new Error('Failed to fetch workflows')
  }

  return response.json()
}

async function createWorkflow(workflow: Partial<Workflow>): Promise<Workflow> {
  const response = await fetch(`${API_BASE}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
    credentials: 'include'
  })

  if (!response.ok) throw new Error('Failed to create workflow')
  return response.json()
}

async function updateWorkflow(workflow: Partial<Workflow> & { id: string }): Promise<Workflow> {
  const response = await fetch(`${API_BASE}/workflows/${workflow.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
    credentials: 'include'
  })

  if (!response.ok) throw new Error('Failed to update workflow')
  return response.json()
}

async function deleteWorkflow(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/workflows/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })

  // Workaround: Backend incorrectly returns 404 for successful deletions
  // Treat 200 OK, 204 No Content, and 404 Not Found as successful for DELETE operations
  // if the resource is confirmed to be deleted (as reported by user).
  // A 404 in this context might mean "resource already not found", which implies it's gone.
  if (response.status === 200 || response.status === 204 || response.status === 404) {
      return;
  } else {
      throw new Error(`Failed to delete workflow with status: ${response.status} ${response.statusText}`);
  }
}

async function activateWorkflow(id: string): Promise<{ id: number, isActive: boolean }> {
  const response = await fetch(`${API_BASE}/workflows/${id}/activate`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!response.ok) throw new Error('Failed to activate workflow')
  return response.json()
}

async function deactivateWorkflow(id: string): Promise<{ id: number, isActive: boolean }> {
  const response = await fetch(`${API_BASE}/workflows/${id}/deactivate`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!response.ok) throw new Error('Failed to deactivate workflow')
  return response.json()
}

export function useWorkflows() {
  const queryClient = useQueryClient()

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  })

  const createMutation = useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })

  const activateMutation = useMutation({
    mutationFn: activateWorkflow,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workflows'] })
    }
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateWorkflow,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workflows'] })
    }
  })

  return {
    workflows: workflowsQuery.data || [],
    isLoading: workflowsQuery.isLoading,
    isError: workflowsQuery.isError,
    error: workflowsQuery.error,
    createWorkflow: createMutation.mutateAsync,
    updateWorkflow: updateMutation.mutateAsync,
    deleteWorkflow: deleteMutation.mutateAsync,
    activateWorkflow: activateMutation.mutateAsync,
    deactivateWorkflow: deactivateMutation.mutateAsync
  }
}
