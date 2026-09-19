export interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, options?.timeoutMs ?? 10000);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const defaultApiClient = new ApiClient();
