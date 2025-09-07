'use client';

/**
 * CLUSTER MANAGEMENT HOOK - React Custom Hook
 *
 * REACT HOOKS PATTERNS:
 * - Custom hook for cluster management state and operations
 * - useState for local state management (clusters list, selected cluster)
 * - useCallback for memoized functions to prevent unnecessary re-renders
 * - useEffect for side effects (loading saved clusters, persistence)
 *
 * LOCAL STORAGE INTEGRATION:
 * - Persists cluster configurations in browser localStorage
 * - Automatic loading of saved clusters on hook initialization
 * - Immediate persistence when clusters are added/removed
 * - JSON serialization for complex cluster objects
 *
 * CLUSTER MANAGEMENT OPERATIONS:
 * - Add new cluster configurations with validation
 * - Remove clusters from saved list
 * - Select/switch between different clusters
 * - Refresh cluster list from storage
 */

import { KafkaCluster, ClusterConfig } from '@/types/kafka';
import { useCallback, useEffect, useState } from 'react';
import { useClusterConnection } from './use-cluster-connection';

interface UseClusterManagementReturn {
  clusters: KafkaCluster[];
  selectedCluster: KafkaCluster | null;
  isLoading: boolean;
  error: string | null;
  addCluster: (config: ClusterConfig) => Promise<void>;
  removeCluster: (clusterId: string) => Promise<void>;
  selectCluster: (cluster: KafkaCluster) => Promise<void>;
  disconnectCluster: () => void;
  refetch: () => void;
}

const CLUSTERS_STORAGE_KEY = 'kafka-ui-clusters';
const SELECTED_CLUSTER_KEY = 'kafka-ui-selected-cluster';

/**
 * CLUSTER MANAGEMENT HOOK
 *
 * Manages multiple Kafka cluster configurations
 * Handles persistence, selection, and CRUD operations
 */
export function useClusterManagement(): UseClusterManagementReturn {
  const [clusters, setClusters] = useState<KafkaCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<KafkaCluster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // INTEGRATE WITH GLOBAL CONNECTION STATE
  const { cluster: connectedCluster, connect, disconnect } = useClusterConnection();

  // LOAD CLUSTERS: Retrieve saved clusters from localStorage
  const loadClusters = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Load clusters from localStorage
      const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
      const parsedClusters: KafkaCluster[] = savedClusters 
        ? JSON.parse(savedClusters) 
        : [];

      setClusters(parsedClusters);

      // Load selected cluster if available
      const savedSelectedId = localStorage.getItem(SELECTED_CLUSTER_KEY);
      if (savedSelectedId && parsedClusters.length > 0) {
        const selectedClusterData = parsedClusters.find(c => c.id === savedSelectedId);
        if (selectedClusterData) {
          setSelectedCluster(selectedClusterData);
        }
      }

      setIsLoading(false);
    } catch (err) {
      setError('Failed to load saved clusters');
      setIsLoading(false);
      console.error('Error loading clusters:', err);
    }
  }, []);

  // SAVE CLUSTERS: Persist clusters to localStorage
  const saveClusters = useCallback((clustersToSave: KafkaCluster[]) => {
    try {
      localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(clustersToSave));
    } catch (err) {
      console.error('Error saving clusters:', err);
      setError('Failed to save cluster configuration');
    }
  }, []);

  // ADD CLUSTER: Create new cluster configuration
  const addCluster = useCallback(async (config: ClusterConfig): Promise<void> => {
    try {
      setError(null);

      // Generate unique ID for the cluster
      const newCluster: KafkaCluster = {
        id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: config.name,
        bootstrapServers: config.bootstrapServers,
        status: 'disconnected', // Start as disconnected, connection will be tested separately
        version: undefined, // Will be populated when connection is established
        controllerId: undefined,
        clusterId: undefined,
      };

      // Validate cluster configuration
      if (!config.name.trim()) {
        throw new Error('Cluster name is required');
      }

      if (!config.bootstrapServers.trim()) {
        throw new Error('Bootstrap servers are required');
      }

      // Check for duplicate names
      const existingCluster = clusters.find(c => 
        c.name.toLowerCase() === config.name.toLowerCase()
      );
      
      if (existingCluster) {
        throw new Error(`A cluster named "${config.name}" already exists`);
      }

      // Add to clusters list
      const updatedClusters = [...clusters, newCluster];
      setClusters(updatedClusters);
      saveClusters(updatedClusters);

      // Auto-select the newly added cluster
      setSelectedCluster(newCluster);
      localStorage.setItem(SELECTED_CLUSTER_KEY, newCluster.id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add cluster';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [clusters, saveClusters]);

  // REMOVE CLUSTER: Delete cluster configuration
  const removeCluster = useCallback(async (clusterId: string): Promise<void> => {
    try {
      setError(null);

      const updatedClusters = clusters.filter(c => c.id !== clusterId);
      setClusters(updatedClusters);
      saveClusters(updatedClusters);

      // Clear selection if the removed cluster was selected
      if (selectedCluster?.id === clusterId) {
        setSelectedCluster(null);
        localStorage.removeItem(SELECTED_CLUSTER_KEY);
      }

    } catch (err) {
      const errorMessage = 'Failed to remove cluster';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [clusters, selectedCluster, saveClusters]);

  // SELECT CLUSTER: Choose active cluster and connect to it
  const selectCluster = useCallback(async (cluster: KafkaCluster) => {
    try {
      setSelectedCluster(cluster);
      localStorage.setItem(SELECTED_CLUSTER_KEY, cluster.id);
      
      // Connect to the selected cluster using the global connection context
      await connect({
        name: cluster.name,
        bootstrapServers: cluster.bootstrapServers,
      });
    } catch (error) {
      console.error('Failed to connect to selected cluster:', error);
      setError(`Failed to connect to ${cluster.name}`);
    }
  }, [connect]);

  // DISCONNECT CLUSTER: Disconnect from current cluster using global context
  const disconnectCluster = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // REFETCH: Reload clusters from storage
  const refetch = useCallback(() => {
    loadClusters();
  }, [loadClusters]);

  // EFFECT: Load clusters on mount
  useEffect(() => {
    loadClusters();
  }, [loadClusters]);

  // EFFECT: Sync selected cluster with connected cluster
  useEffect(() => {
    if (connectedCluster) {
      // Find the matching cluster in our saved clusters
      let matchingCluster = clusters.find(c => 
        c.bootstrapServers === connectedCluster.bootstrapServers ||
        c.name === connectedCluster.name
      );
      
      if (!matchingCluster) {
        // Auto-add connected cluster to saved clusters if it's not there
        const newCluster: KafkaCluster = {
          id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: connectedCluster.name,
          bootstrapServers: connectedCluster.bootstrapServers,
          status: connectedCluster.status,
          version: connectedCluster.version,
          controllerId: connectedCluster.controllerId,
          clusterId: connectedCluster.clusterId,
        };
        
        const updatedClusters = [...clusters, newCluster];
        setClusters(updatedClusters);
        saveClusters(updatedClusters);
        matchingCluster = newCluster;
      }
      
      if (matchingCluster) {
        setSelectedCluster(matchingCluster);
        localStorage.setItem(SELECTED_CLUSTER_KEY, matchingCluster.id);
      }
    } else if (!connectedCluster) {
      // Clear selection when disconnected
      setSelectedCluster(null);
      localStorage.removeItem(SELECTED_CLUSTER_KEY);
    }
  }, [connectedCluster, clusters, saveClusters]);

  return {
    clusters,
    selectedCluster,
    isLoading,
    error,
    addCluster,
    removeCluster,
    selectCluster,
    disconnectCluster,
    refetch,
  };
}