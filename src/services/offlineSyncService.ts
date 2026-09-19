import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateApplicationPayload } from '../models/application.model';
import { QueuedApplication } from '../models/offlineQueue.model';
import { applicationService } from './applicationService';

const OFFLINE_QUEUE_KEY = '@thh_offline_application_queue';

export class OfflineSyncService {
  /**
   * Add an application payload to the offline queue.
   */
  async enqueue(payload: CreateApplicationPayload): Promise<QueuedApplication> {
    const queue = await this.getQueue();
    const queuedItem: QueuedApplication = {
      id: `LOCAL_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      payload,
      created_at: new Date().toISOString(),
      attempts: 0,
      status: 'pending',
    };

    queue.push(queuedItem);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return queuedItem;
  }

  /**
   * Retrieve all queued applications.
   */
  async getQueue(): Promise<QueuedApplication[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Count of pending items in queue.
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter(q => q.status === 'pending' || q.status === 'failed')
      .length;
  }

  /**
   * Synchronize all pending items in queue with backend.
   */
  async syncQueue(): Promise<{ synced: number; failed: number }> {
    const queue = await this.getQueue();
    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const remainingQueue: QueuedApplication[] = [];

    for (const item of queue) {
      try {
        item.attempts += 1;
        item.status = 'syncing';
        await applicationService.createApplication(item.payload);
        syncedCount += 1;
        // Synced successfully, do not push to remainingQueue
      } catch (err: unknown) {
        failedCount += 1;
        item.status = 'failed';
        item.last_error =
          err instanceof Error ? err.message : 'Network failure';
        remainingQueue.push(item);
      }
    }

    await AsyncStorage.setItem(
      OFFLINE_QUEUE_KEY,
      JSON.stringify(remainingQueue),
    );
    return { synced: syncedCount, failed: failedCount };
  }

  /**
   * Clear the entire queue (for debugging or reset).
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}

export const offlineSyncService = new OfflineSyncService();
