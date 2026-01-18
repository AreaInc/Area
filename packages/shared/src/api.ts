// let _apiBase = "https://api.areamoncul.click/api";
let _apiBase = "http://localhost:8080/api";

export function setApiBase(url: string): void {
    _apiBase = url;
}

export function getApiBase(): string {
    return _apiBase;
}
