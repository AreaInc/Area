import { useQuery } from "@tanstack/react-query";
import { ActionMetadata } from "../types/workflow";
import { API_BASE } from "./const";

export function useActions() {
  return useQuery<ActionMetadata[]>({
    queryKey: ['actions'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/actions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch actions');
      }

      return response.json();
    },
  });
}

export function useServiceActions(service: string) {
  return useQuery<ActionMetadata[]>({
    queryKey: ['actions', service],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/actions/${service}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service actions');
      }

      return response.json();
    },
    enabled: !!service,
  });
}