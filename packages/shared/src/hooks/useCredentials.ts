import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Credential, CreateCredentialDto } from '../types/credential';
import { getApiBase } from './const';

// Standalone fetch functions
export async function fetchCredentials(): Promise<Credential[]> {
  const response = await fetch(`${getApiBase()}/oauth2-credential`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credentials');
  }

  return response.json();
}

export async function fetchCredential(credentialId: number): Promise<Credential> {
  const response = await fetch(`${getApiBase()}/oauth2-credential/${credentialId}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credential');
  }

  return response.json();
}

export async function createCredential(dto: CreateCredentialDto): Promise<Credential> {
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
}

export async function deleteCredential(credentialId: number): Promise<Credential> {
  const response = await fetch(`${getApiBase()}/oauth2-credential/${credentialId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to delete credential');
  }

  return response.json();
}

export function getOAuthAuthUrl(credentialId: number, redirectUrl?: string): string {
  const url = new URL(`${getApiBase()}/oauth2-credential/auth`);
  url.searchParams.set('credentialId', credentialId.toString());
  if (redirectUrl) {
    url.searchParams.set('redirectUrl', redirectUrl);
  }
  return url.toString();
}

/** @deprecated Use getOAuthAuthUrl instead */
export const useInitiateOAuth = getOAuthAuthUrl;

export function getOAuthCallbackUrl(): string {
  return `${getApiBase()}/oauth2-credential/callback`;
}

// React Query Hooks (reuse standalone functions)
export function useCredentials() {
  return useQuery<Credential[]>({
    queryKey: ['credentials'],
    queryFn: fetchCredentials,
  });
}

export function useCredential(credentialId: number) {
  return useQuery<Credential>({
    queryKey: ['credentials', credentialId],
    queryFn: () => fetchCredential(credentialId),
    enabled: !!credentialId,
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
    },
  });
}
