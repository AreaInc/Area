import { API_URL } from '@env';

const BASE_URL = API_URL || 'http://10.0.2.2:8080';

const request = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    console.log(`[API] Requesting: ${options.method || 'GET'} ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const config = {
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

        const data = await response.json();

        if (!response.ok) {
            console.log('[API] Error data:', data);
            return { error: data.error || data || { message: `Request failed with status ${response.status}` }, status: response.status };
        }

        return { data, status: response.status };
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('[API] Request Error:', error);
        return { error: { message: error.message || 'Network request failed' } };
    }
};

export const api = {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
