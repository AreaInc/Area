// Environment variable handling for both Web and Mobile
// This module provides a configurable API base URL for the shared hooks.

let _apiBase = "https://api.areamoncul.click/api";

// Auto-detect localhost environment for Web
try {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        _apiBase = `http://${window.location.hostname}:8080/api`;
    }
} catch (e) { }

/**
 * Set the API base URL for all shared hooks.
 * Call this at app initialization before using any hooks.
 * 
 * @param url - The base URL for the API (e.g., "http://192.168.1.137:8080/api")
 */
export function setApiBase(url: string): void {
    _apiBase = url;
}

/**
 * Get the current API base URL.
 */
export function getApiBase(): string {
    return _apiBase;
}

/**
 * @deprecated Use getApiBase() instead. Kept for backward compatibility.
 */
export const API_BASE = "https://api.areamoncul.click/api";
