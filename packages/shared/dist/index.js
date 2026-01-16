"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  API_BASE: () => API_BASE,
  getOAuthCallbackUrl: () => getOAuthCallbackUrl,
  useActions: () => useActions,
  useActivateWorkflow: () => useActivateWorkflow,
  useCreateCredential: () => useCreateCredential,
  useCreateWorkflow: () => useCreateWorkflow,
  useCredential: () => useCredential,
  useCredentials: () => useCredentials,
  useDeactivateWorkflow: () => useDeactivateWorkflow,
  useDeleteCredential: () => useDeleteCredential,
  useDeleteWorkflow: () => useDeleteWorkflow,
  useExecuteWorkflow: () => useExecuteWorkflow,
  useHello: () => useHello,
  useInitiateOAuth: () => useInitiateOAuth,
  useService: () => useService,
  useServices: () => useServices,
  useTriggers: () => useTriggers,
  useUpdateWorkflow: () => useUpdateWorkflow,
  useWorkflow: () => useWorkflow,
  useWorkflowExecutions: () => useWorkflowExecutions,
  useWorkflows: () => useWorkflows
});
module.exports = __toCommonJS(index_exports);

// src/hooks/useHello.ts
var import_react_query = require("@tanstack/react-query");
var fetchHello = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1e3));
  return "Hello from the Shared Package!";
};
var useHello = () => {
  return (0, import_react_query.useQuery)({
    queryKey: ["hello"],
    queryFn: fetchHello
  });
};

// src/hooks/const.ts
var API_BASE = "http://localhost:8080/api";

// src/hooks/useCredentials.ts
var import_react_query2 = require("@tanstack/react-query");
function useCredentials() {
  return (0, import_react_query2.useQuery)({
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
  return (0, import_react_query2.useQuery)({
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
  const queryClient = (0, import_react_query2.useQueryClient)();
  return (0, import_react_query2.useMutation)({
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
  const queryClient = (0, import_react_query2.useQueryClient)();
  return (0, import_react_query2.useMutation)({
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
var import_react_query3 = require("@tanstack/react-query");
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
  const servicesQuery = (0, import_react_query3.useQuery)({
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
  const serviceQuery = (0, import_react_query3.useQuery)({
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
var import_react_query4 = require("@tanstack/react-query");
function useWorkflows() {
  return (0, import_react_query4.useQuery)({
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
  return (0, import_react_query4.useQuery)({
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
  const queryClient = (0, import_react_query4.useQueryClient)();
  return (0, import_react_query4.useMutation)({
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
  const queryClient = (0, import_react_query4.useQueryClient)();
  return (0, import_react_query4.useMutation)({
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
  const queryClient = (0, import_react_query4.useQueryClient)();
  return (0, import_react_query4.useMutation)({
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
  const queryClient = (0, import_react_query4.useQueryClient)();
  return (0, import_react_query4.useMutation)({
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
  const queryClient = (0, import_react_query4.useQueryClient)();
  return (0, import_react_query4.useMutation)({
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
  return (0, import_react_query4.useMutation)({
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
  return (0, import_react_query4.useQuery)({
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
  return (0, import_react_query4.useQuery)({
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
  return (0, import_react_query4.useQuery)({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
  useHello,
  useInitiateOAuth,
  useService,
  useServices,
  useTriggers,
  useUpdateWorkflow,
  useWorkflow,
  useWorkflowExecutions,
  useWorkflows
});
