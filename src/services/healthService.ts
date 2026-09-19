import { ApiClient, defaultApiClient } from './apiClient';
import { AppFeature, BackendHealthStatus } from '../models';

export class HealthService {
  constructor(private client: ApiClient = defaultApiClient) {}

  async checkBackendHealth(): Promise<BackendHealthStatus> {
    try {
      // In development, test backend or provide graceful fallback
      const data = await this.client.get<{ status?: string; version?: string }>(
        '/api/health',
        { timeoutMs: 3000 },
      );
      return {
        status: 'connected',
        backendUrl: this.client.getBaseUrl(),
        version: data.version ?? 'Laravel 13.x',
        lastCheckedAt: new Date().toLocaleTimeString(),
        message: 'Laravel Backend is connected and reachable.',
      };
    } catch {
      return {
        status: 'disconnected',
        backendUrl: this.client.getBaseUrl(),
        version: 'Laravel 13.x',
        lastCheckedAt: new Date().toLocaleTimeString(),
        message:
          'Backend server is currently offline or unreachable at default URL.',
      };
    }
  }

  getArchitecturalFeatures(): AppFeature[] {
    return [
      {
        id: 'mvvm-pattern',
        title: 'MVVM Architecture',
        description: 'Clean separation across Models, ViewModels, and Views.',
        category: 'architecture',
        isConfigured: true,
      },
      {
        id: 'linters',
        title: 'ESLint & Prettier',
        description:
          'Code linting and formatting configured with strict TypeScript.',
        category: 'linter',
        isConfigured: true,
      },
      {
        id: 'git-pre-push',
        title: 'Pre-Push Git Hook',
        description:
          'Prevents pushing unlinted or failing code to GitHub repository.',
        category: 'linter',
        isConfigured: true,
      },
      {
        id: 'laravel-backend',
        title: 'Laravel 13 Backend',
        description:
          'PHP Pint, Larastan, and Inertia React ready with pre-push hooks.',
        category: 'backend',
        isConfigured: true,
      },
    ];
  }
}

export const healthService = new HealthService();
