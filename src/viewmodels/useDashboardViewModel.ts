import { useState, useEffect, useCallback } from 'react';
import { Application } from '../models/application.model';
import {
  applicationService,
  DashboardStats,
} from '../services/applicationService';
import { offlineSyncService } from '../services/offlineSyncService';

export interface DashboardViewModelState {
  stats: DashboardStats;
  recentApplications: Application[];
  pendingOfflineCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export interface DashboardViewModelActions {
  loadDashboard: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
}

export function useDashboardViewModel(): DashboardViewModelState &
  DashboardViewModelActions {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    verification: 0,
    assistance: 0,
    resolved: 0,
    rating: null,
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>(
    [],
  );
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const [fetchedStats, fetchedApps, offlineCount] = await Promise.all([
        applicationService.getDashboardStats(),
        applicationService.getMyApplications(),
        offlineSyncService.getPendingCount(),
      ]);

      setStats(fetchedStats);
      setRecentApplications(fetchedApps.slice(0, 10));
      setPendingOfflineCount(offlineCount);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  }, [loadDashboard]);

  const syncOfflineQueue = useCallback(async () => {
    try {
      await offlineSyncService.syncQueue();
      const count = await offlineSyncService.getPendingCount();
      setPendingOfflineCount(count);
      await loadDashboard();
    } catch {
      // ignore
    }
  }, [loadDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    stats,
    recentApplications,
    pendingOfflineCount,
    isLoading,
    isRefreshing,
    error,
    loadDashboard,
    refreshDashboard,
    syncOfflineQueue,
  };
}
