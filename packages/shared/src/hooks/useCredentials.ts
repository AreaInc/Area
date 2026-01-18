import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Credential, CreateCredentialDto } from '../types/credential';
import { getApiBase } from '../api';

export function useCredentials() {
  return useQuery<Credential[]>({
    queryKey: ['credentials'],
    queryFn: async () => {
      const response = await fetch(`${getApiBase()}/oauth2-credential`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }

      return response.json();
    },
  });
}

export function useCredential(credentialId: number) {
  return useQuery<Credential>({
    queryKey: ['credentials', credentialId],
    queryFn: async () => {
      const response = await fetch(`${getApiBase()}/oauth2-credential/${credentialId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credential');
      }

      return response.json();
    },
    enabled: !!credentialId,
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCredentialDto) => {
      const response = await fetch(`${getApiBase()}/oauth2-credential`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error('Failed to create credential');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentialId: number) => {
      const response = await fetch(`${getApiBase()}/oauth2-credential/${credentialId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete credential');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}

export function useInitiateOAuth(credentialId: number, redirectUrl?: string) {
  const url = new URL(`${getApiBase()}/oauth2-credential/auth`);
  url.searchParams.set('credentialId', credentialId.toString());
  if (redirectUrl) {
    url.searchParams.set('redirectUrl', redirectUrl);
  }

  return url.toString();
}

export function getOAuthCallbackUrl() {
  return `${getApiBase()}/oauth2-credential/callback`;
}
