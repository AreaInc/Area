import { API_URL } from '@env';
import type { ApiResponse } from '../types';

const BASE_URL: string = API_URL || 'http://10.0.2.2:8080';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

const request = async <T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    const url = `${BASE_URL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Origin': BASE_URL, // Required for auth endpoints
    };

    console.log(`[API] Requesting: ${options.method || 'GET'} ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        credentials: 'include',
        signal: controller.signal,
    };

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        console.log(`[API] Response status: ${response.status}`);

        const data = await response.json() as T;

        if (!response.ok) {
            console.log('[API] Error data:', data);
            return {
                error: (data as { error?: { message: string } })?.error || { message: `Request failed with status ${response.status}` },
                status: response.status
            };
        }

        return { data, status: response.status };
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('[API] Request Error:', error);
        return { error: { message: (error as Error).message || 'Network request failed' } };
    }
};

export const api = {
    get: <T = unknown>(endpoint: string): Promise<ApiResponse<T>> =>
        request<T>(endpoint, { method: 'GET' }),
    post: <T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> =>
        request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: <T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> =>
        request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T = unknown>(endpoint: string): Promise<ApiResponse<T>> =>
        request<T>(endpoint, { method: 'DELETE' }),
    getBaseUrl: (): string => BASE_URL,
};
