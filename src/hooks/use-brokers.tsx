'use client';

/**
 * BROKER MANAGEMENT HOOK - React Custom Hook
 *
 * REACT HOOKS PATTERNS:
 * - Custom hook for Kafka broker data management
 * - useState for broker list state and loading states
 * - useEffect for data fetching and cleanup
 * - useCallback for memoized API calls
 *
 * KAFKA BROKER OPERATIONS:
 * - Fetch broker list from Kafka cluster
 * - Monitor broker health and status
 * - Retrieve broker metrics and configuration
 * - Handle broker connection errors and retries
 *
 * REAL-TIME DATA MANAGEMENT:
 * - Periodic refresh of broker data
 * - Connection status monitoring
 * - Error handling with retry logic
 * - Automatic cleanup on component unmount
 */

import { Broker } from '@/types/kafka';
import { useCallback, useEffect, useState } from 'react';
import { useClusterConnection } from './use-cluster-connection';

interface UseBrokerManagementReturn {
  brokers: Broker[];
  isLoadingBrokers: boolean;
  brokersError: string | null;
  refetchBrokers: () => Promise<void>;
}

/**
 * BROKER MANAGEMENT HOOK
 *
 * Manages Kafka broker data fetching and state
 * Provides broker list with health status and metrics
 */
export function useBrokerManagement(): UseBrokerManagementReturn {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false);
  const [brokersError, setBrokersError] = useState<string | null>(null);

  const { cluster, isConnecting } = useClusterConnection();

  // FETCH BROKERS: Retrieve broker list via API route
  const fetchBrokers = useCallback(async (): Promise<void> => {
    if (!cluster || cluster.status !== 'connected' || isConnecting) {
      setBrokers([]);
      return;
    }

    setIsLoadingBrokers(true);
    setBrokersError(null);

    try {
      // Call API route instead of kafkaService directly
      const response = await fetch('/api/kafka/brokers');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch brokers');
      }

      // The API already returns properly formatted broker data
      setBrokers(result.data || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to fetch broker information';
      
      setBrokersError(errorMessage);
      
      // Clear brokers on error
      setBrokers([]);
      
      console.error('Error fetching brokers:', error);
    } finally {
      setIsLoadingBrokers(false);
    }
  }, [cluster, isConnecting]);

  // REFETCH BROKERS: Manual refresh function
  const refetchBrokers = useCallback(async (): Promise<void> => {
    await fetchBrokers();
  }, [fetchBrokers]);

  // EFFECT: Fetch brokers when cluster connection changes
  useEffect(() => {
    if (cluster && cluster.status === 'connected') {
      fetchBrokers();
    } else {
      // Clear brokers when not connected
      setBrokers([]);
      setBrokersError(null);
      setIsLoadingBrokers(false);
    }
  }, [cluster, fetchBrokers]);

  // EFFECT: Set up periodic refresh for real-time monitoring
  useEffect(() => {
    if (!cluster || cluster.status !== 'connected') {
      return;
    }

    // Set up interval for periodic broker health checks
    const refreshInterval = setInterval(() => {
      // Only refresh if not currently loading
      if (!isLoadingBrokers) {
        fetchBrokers();
      }
    }, 30000); // Refresh every 30 seconds

    // Cleanup interval on unmount or cluster change
    return () => {
      clearInterval(refreshInterval);
    };
  }, [cluster, isLoadingBrokers, fetchBrokers]);

  return {
    brokers,
    isLoadingBrokers,
    brokersError,
    refetchBrokers,
  };
}