import { useQuery } from "@tanstack/react-query";
import { ActionMetadata } from "../types/workflow";
import { getApiBase } from "../api";

export function useActions() {
  return useQuery<ActionMetadata[]>({
    queryKey: ['actions'],
    queryFn: async () => {
      const response = await fetch(`${getApiBase()}/v2/actions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch actions');
      }

      return response.json();
    },
  });
}
