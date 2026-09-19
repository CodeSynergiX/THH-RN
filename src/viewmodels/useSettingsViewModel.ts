import { useState, useEffect, useCallback } from 'react';
import { QueuedApplication } from '../models/offlineQueue.model';
import { offlineSyncService } from '../services/offlineSyncService';

export function useSettingsViewModel() {
  const [queuedItems, setQueuedItems] = useState<QueuedApplication[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(
    null,
  );

  const loadQueue = useCallback(async () => {
    try {
      const items = await offlineSyncService.getQueue();
      setQueuedItems(items);
    } catch {
      setQueuedItems([]);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const syncQueue = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatusMessage(null);
    try {
      const result = await offlineSyncService.syncQueue();
      await loadQueue();
      setSyncStatusMessage(
        `સિન્ક પૂર્ણ: ${result.synced} સફળ, ${result.failed} બાકી (Sync complete: ${result.synced} synced, ${result.failed} failed)`,
      );
    } catch (err: unknown) {
      setSyncStatusMessage(
        err instanceof Error ? err.message : 'સિન્ક કરવામાં ભૂલ (Sync failed)',
      );
    } finally {
      setIsSyncing(false);
    }
  }, [loadQueue]);

  const clearQueue = useCallback(async () => {
    await offlineSyncService.clearQueue();
    await loadQueue();
    setSyncStatusMessage('ઓફલાઇન યાદી સાફ કરવામાં આવી (Offline queue cleared)');
  }, [loadQueue]);

  return {
    queuedItems,
    isSyncing,
    syncStatusMessage,
    loadQueue,
    syncQueue,
    clearQueue,
  };
}
