export interface BackendHealthStatus {
  status: 'connected' | 'disconnected' | 'checking';
  backendUrl: string;
  version: string;
  lastCheckedAt?: string;
  message: string;
}

export interface AppFeature {
  id: string;
  title: string;
  description: string;
  category: 'architecture' | 'linter' | 'backend';
  isConfigured: boolean;
}
