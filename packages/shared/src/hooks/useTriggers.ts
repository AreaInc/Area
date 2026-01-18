import { useQuery } from "@tanstack/react-query";
import { TriggerMetadata } from "../types/workflow";
import { getApiBase } from "../api";

export function useTriggers() {
  return useQuery<TriggerMetadata[]>({
    queryKey: ['triggers'],
    queryFn: async () => {
      const response = await fetch(`${getApiBase()}/v2/triggers`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch triggers');
      }

      return response.json();
    },
  });
}
