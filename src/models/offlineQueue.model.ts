import { CreateApplicationPayload } from './application.model';

export interface QueuedApplication {
  id: string; // local client UUID
  payload: CreateApplicationPayload;
  created_at: string;
  attempts: number;
  last_error?: string | null;
  status: 'pending' | 'syncing' | 'failed';
}
