import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppFeature, BackendHealthStatus } from '../models';
import { healthService } from '../services';

export type FeatureCategoryFilter =
  | 'all'
  | 'architecture'
  | 'linter'
  | 'backend';

export interface HomeViewModel {
  backendHealth: BackendHealthStatus;
  filteredFeatures: AppFeature[];
  selectedCategory: FeatureCategoryFilter;
  isCheckingHealth: boolean;
  totalConfiguredCount: number;
  handleCategoryChange: (category: FeatureCategoryFilter) => void;
  handleRefreshHealth: () => Promise<void>;
}

export function useHomeViewModel(): HomeViewModel {
  const [backendHealth, setBackendHealth] = useState<BackendHealthStatus>({
    status: 'checking',
    backendUrl: 'http://localhost:8000',
    version: 'Laravel 13.x',
    message: 'Initializing health check...',
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] =
    useState<FeatureCategoryFilter>('all');
  const [features, setFeatures] = useState<AppFeature[]>([]);

  const fetchHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const status = await healthService.checkBackendHealth();
      setBackendHealth(status);
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    setFeatures(healthService.getArchitecturalFeatures());
    fetchHealth();
  }, [fetchHealth]);

  const handleCategoryChange = useCallback(
    (category: FeatureCategoryFilter) => {
      setSelectedCategory(category);
    },
    [],
  );

  const handleRefreshHealth = useCallback(async () => {
    await fetchHealth();
  }, [fetchHealth]);

  const filteredFeatures = useMemo(() => {
    if (selectedCategory === 'all') {
      return features;
    }
    return features.filter(item => item.category === selectedCategory);
  }, [features, selectedCategory]);

  const totalConfiguredCount = useMemo(() => {
    return features.filter(item => item.isConfigured).length;
  }, [features]);

  return {
    backendHealth,
    filteredFeatures,
    selectedCategory,
    isCheckingHealth,
    totalConfiguredCount,
    handleCategoryChange,
    handleRefreshHealth,
  };
}
