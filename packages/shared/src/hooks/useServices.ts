import { useQuery } from '@tanstack/react-query'
import type { Service } from '../types/service'
import { API_BASE } from './const';

async function fetchServices(): Promise<Service[]> {
  const response = await fetch(`${API_BASE}/services`, {
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch services')
  }

  return response.json()
}

async function fetchService(provider: string): Promise<Service> {
  const response = await fetch(`${API_BASE}/services/${provider}`, {
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch service')
  }

  return response.json()
}

export function useServices() {
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  })

  return {
    services: servicesQuery.data || [],
    isLoading: servicesQuery.isLoading,
    isError: servicesQuery.isError,
    error: servicesQuery.error,
  }
}

export function useService(provider: string) {
  const serviceQuery = useQuery({
    queryKey: ['services', provider],
    queryFn: () => fetchService(provider),
    enabled: !!provider,
  })

  return {
    service: serviceQuery.data,
    isLoading: serviceQuery.isLoading,
    isError: serviceQuery.isError,
    error: serviceQuery.error,
  }
}
