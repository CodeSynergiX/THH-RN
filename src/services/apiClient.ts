import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  idempotencyKey?: string;
}

const AUTH_TOKEN_KEY = '@thh_auth_token';

// Automatically detect emulator vs host
const getDefaultBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'https://history-internet-medium-boolean.trycloudflare.com/api/v1';
    // return 'https://thhapi.codesynergix.com/api/v1';
  }
  return 'https://history-internet-medium-boolean.trycloudflare.com/api/v1';
  // return 'https://thhapi.codesynergix.com/api/v1';
};

export class ApiClient {
  private baseUrl: string;
  private tokenCache: string | null = null;

  constructor(baseUrl: string = getDefaultBaseUrl()) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getAuthToken(): Promise<string | null> {
    if (this.tokenCache !== null) {
      return this.tokenCache;
    }
    try {
      this.tokenCache = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return this.tokenCache;
    } catch {
      return null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    this.tokenCache = token;
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (err) {
      console.warn('Failed to save auth token:', err);
    }
  }

  async clearAuthToken(): Promise<void> {
    this.tokenCache = null;
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (err) {
      console.warn('Failed to clear auth token:', err);
    }
  }

  private async prepareHeaders(
    options?: RequestOptions,
  ): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : {}),
      ...options?.headers,
    };
    return headers;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const doFetch = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        options?.timeoutMs ?? 15000,
      );

      try {
        const headers = await this.prepareHeaders(options);
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const response = await fetch(`${this.baseUrl}${cleanPath}`, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return (await response.json()) as T;
      } finally {
        clearTimeout(timeout);
      }
    };

    try {
      return await doFetch();
    } catch (firstErr) {
      // Automatic 1-retry with backoff for transient glitches / busy php server
      console.log('firstErr', firstErr);
      await new Promise(resolve => setTimeout(() => resolve(undefined), 350));
      return await doFetch();
    }
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeoutMs ?? 15000,
    );

    try {
      const headers = await this.prepareHeaders(options);
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const response = await fetch(`${this.baseUrl}${cleanPath}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let message = `HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(errorBody);
          message = parsed.message || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeoutMs ?? 15000,
    );

    try {
      const headers = await this.prepareHeaders(options);
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const response = await fetch(`${this.baseUrl}${cleanPath}`, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let message = `HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(errorBody);
          message = parsed.message || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async postForm<T>(
    path: string,
    form: FormData,
    options?: RequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeoutMs ?? 30000,
    );
    try {
      const headers = await this.prepareHeaders(options);
      delete headers['Content-Type'];
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const response = await fetch(`${this.baseUrl}${cleanPath}`, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      });
      if (!response.ok) {
        const errorBody = await response.text();
        let message = `HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(errorBody);
          message = parsed.message || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const defaultApiClient = new ApiClient();
