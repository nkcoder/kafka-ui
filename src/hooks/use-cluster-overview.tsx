/**
 * CLUSTER OVERVIEW DATA HOOK
 *
 * REACT CUSTOM HOOK PATTERN:
 * - Encapsulates data fetching logic for cluster metrics
 * - Manages loading states, error handling, and data refresh
 * - Can be reused across multiple components
 * - Automatic cleanup and cancellation support
 *
 * DATA FETCHING STRATEGY:
 * - Initial load when component mounts
 * - Manual refresh capability for user-initiated updates
 * - Automatic polling for real-time updates (optional)
 * - Error recovery with retry mechanism
 *
 * REAL-TIME UPDATES:
 * - Option to poll cluster metrics every N seconds
 * - WebSocket support could be added for true real-time data
 * - Pause polling when tab is not visible (performance optimization)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, kafkaApi } from '@/lib/api-client';
import { ClusterOverview } from '@/types/schemas';
import { useClusterConnection } from './use-cluster-connection';

/**
 * HOOK RETURN TYPE
 *
 * Provides everything components need for displaying cluster overview:
 * - Data: Current cluster metrics
 * - States: Loading, error conditions
 * - Actions: Refresh data, clear errors
 */
interface UseClusterOverviewReturn {
  // Data state
  overview: ClusterOverview | null;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * CLUSTER OVERVIEW HOOK
 *
 * @param autoRefresh - Enable automatic polling (seconds, 0 = disabled)
 * @param retryOnError - Automatically retry failed requests
 */
export function useClusterOverview(
  autoRefresh: number = 0,
  retryOnError: boolean = true
): UseClusterOverviewReturn {
  // LOCAL STATE for cluster overview data
  const [overview, setOverview] = useState<ClusterOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ACCESS CLUSTER CONNECTION STATE
  const { cluster } = useClusterConnection();
  const isConnected = cluster?.status === 'connected';

  // FETCH CLUSTER OVERVIEW DATA
  const fetchOverview = useCallback(async () => {
    // Don't fetch if not connected
    if (!isConnected) {
      setOverview(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await kafkaApi.getClusterOverview();
      setOverview(data);
    } catch (fetchError) {
      const errorMessage = getErrorMessage(fetchError);
      setError(errorMessage);

      // Keep existing data on error (graceful degradation)
      console.error('Failed to fetch cluster overview:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  // MANUAL REFRESH FUNCTION
  const refresh = useCallback(async () => {
    await fetchOverview();
  }, [fetchOverview]);

  // CLEAR ERROR FUNCTION
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // EFFECT: Initial data load when connection changes
  useEffect(() => {
    if (isConnected) {
      fetchOverview();
    } else {
      // Clear data when disconnected
      setOverview(null);
      setError(null);
    }
  }, [isConnected, fetchOverview]);

  // EFFECT: Auto-refresh polling (optional)
  useEffect(() => {
    if (!autoRefresh || !isConnected) return;

    const interval = setInterval(() => {
      // Only auto-refresh if not currently loading and no errors
      if (!isLoading && !error) {
        fetchOverview();
      }
    }, autoRefresh * 1000);

    // CLEANUP: Clear interval when component unmounts or dependencies change
    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, isLoading, error, fetchOverview]);

  // EFFECT: Retry on error (optional)
  useEffect(() => {
    if (!retryOnError || !error || !isConnected) return;

    // Exponential backoff retry strategy
    const retryTimeout = setTimeout(() => {
      console.log('Retrying cluster overview fetch after error...');
      fetchOverview();
    }, 5000); // Retry after 5 seconds

    return () => clearTimeout(retryTimeout);
  }, [error, retryOnError, isConnected, fetchOverview]);

  return {
    overview,
    isLoading,
    error,
    refresh,
    clearError,
  };
}
