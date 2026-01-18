import { useQuery } from "@tanstack/react-query";
import { TriggerMetadata } from "../types/workflow";
import { API_BASE } from "./const";

export function useTriggers() {
  return useQuery<TriggerMetadata[]>({
    queryKey: ['triggers'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/triggers`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch triggers');
      }

      return response.json();
    },
  });
}

export function useServiceTriggers(service: string) {
  return useQuery<TriggerMetadata[]>({
    queryKey: ['triggers', service],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/v2/triggers/${service}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service triggers');
      }

      return response.json();
    },
    enabled: !!service,
  });
}