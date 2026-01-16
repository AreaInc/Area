// src/hooks/const.ts
var API_BASE = "http://localhost:8080/api";

// src/hooks/useCredentials.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
function useCredentials() {
  return useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/oauth2-credential`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch credentials");
      }
      return response.json();
    }
  });
}
function useCredential(credentialId) {
  return useQuery({
    queryKey: ["credentials", credentialId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/oauth2-credential/${credentialId}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch credential");
      }
      return response.json();
    },
    enabled: !!credentialId
  });
}
function useCreateCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto) => {
      const response = await fetch(`${API_BASE}/oauth2-credential`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(dto)
      });
      if (!response.ok) {
        throw new Error("Failed to create credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    }
  });
}
function useDeleteCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentialId) => {
      const response = await fetch(`${API_BASE}/oauth2-credential/${credentialId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to delete credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    }
  });
}
function useInitiateOAuth(credentialId, redirectUrl) {
  const url = new URL(`${API_BASE}/oauth2-credential/auth`);
  url.searchParams.set("credentialId", credentialId.toString());
  if (redirectUrl) {
    url.searchParams.set("redirectUrl", redirectUrl);
  }
  return url.toString();
}
function getOAuthCallbackUrl() {
  return `${API_BASE}/oauth2-credential/callback`;
}

// src/hooks/useServices.ts
import { useQuery as useQuery2 } from "@tanstack/react-query";
async function fetchServices() {
  const response = await fetch(`${API_BASE}/services`, {
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }
  return response.json();
}
async function fetchService(provider) {
  const response = await fetch(`${API_BASE}/services/${provider}`, {
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to fetch service");
  }
  return response.json();
}
function useServices() {
  const servicesQuery = useQuery2({
    queryKey: ["services"],
    queryFn: fetchServices
  });
  return {
    services: servicesQuery.data || [],
    isLoading: servicesQuery.isLoading,
    isError: servicesQuery.isError,
    error: servicesQuery.error
  };
}
function useService(provider) {
  const serviceQuery = useQuery2({
    queryKey: ["services", provider],
    queryFn: () => fetchService(provider),
    enabled: !!provider
  });
  return {
    service: serviceQuery.data,
    isLoading: serviceQuery.isLoading,
    isError: serviceQuery.isError,
    error: serviceQuery.error
  };
}

// src/hooks/useWorkflows.ts
import { useQuery as useQuery3, useMutation as useMutation2, useQueryClient as useQueryClient2 } from "@tanstack/react-query";
function useWorkflows() {
  return useQuery3({
    queryKey: ["workflows"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/workflows`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }
      return response.json();
    }
  });
}
function useWorkflow(id) {
  return useQuery3({
    queryKey: ["workflows", id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/workflows/${id}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch workflow");
      }
      return response.json();
    },
    enabled: !!id
  });
}
function useCreateWorkflow() {
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: async (dto) => {
      const response = await fetch(`${API_BASE}/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
        credentials: "include"
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Failed to create workflow (${response.status})`;
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    }
  });
}
function useUpdateWorkflow() {
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: async ({ id, dto }) => {
      const response = await fetch(`${API_BASE}/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to update workflow");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    }
  });
}
function useDeleteWorkflow() {
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: async (id) => {
      const response = await fetch(`${API_BASE}/workflows/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to delete workflow");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    }
  });
}
function useActivateWorkflow() {
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: async (id) => {
      const response = await fetch(`${API_BASE}/workflows/${id}/activate`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to activate workflow");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    }
  });
}
function useDeactivateWorkflow() {
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: async (id) => {
      const response = await fetch(`${API_BASE}/workflows/${id}/deactivate`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to deactivate workflow");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    }
  });
}
function useExecuteWorkflow() {
  return useMutation2({
    mutationFn: async ({ id, triggerData }) => {
      const response = await fetch(`${API_BASE}/workflows/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerData }),
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to execute workflow");
      }
      return response.json();
    }
  });
}
function useWorkflowExecutions(workflowId) {
  return useQuery3({
    queryKey: ["workflows", workflowId, "executions"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/workflows/${workflowId}/executions`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch workflow executions");
      }
      return response.json();
    },
    enabled: !!workflowId
  });
}
function useTriggers() {
  return useQuery3({
    queryKey: ["triggers"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/workflows/metadata/triggers`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch triggers");
      }
      return response.json();
    }
  });
}
function useActions() {
  return useQuery3({
    queryKey: ["actions"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/workflows/metadata/actions`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch actions");
      }
      return response.json();
    }
  });
}
export {
  API_BASE,
  getOAuthCallbackUrl,
  useActions,
  useActivateWorkflow,
  useCreateCredential,
  useCreateWorkflow,
  useCredential,
  useCredentials,
  useDeactivateWorkflow,
  useDeleteCredential,
  useDeleteWorkflow,
  useExecuteWorkflow,
  useInitiateOAuth,
  useService,
  useServices,
  useTriggers,
  useUpdateWorkflow,
  useWorkflow,
  useWorkflowExecutions,
  useWorkflows
};
