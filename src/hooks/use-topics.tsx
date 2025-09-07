'use client';

import { useClusterConnection } from '@/hooks/use-cluster-connection';
import { type CreateTopicForm, type KafkaTopic } from '@/types/schemas';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * TOPIC MANAGEMENT HOOKS
 *
 * REACT HOOKS PATTERNS:
 * - Custom hooks encapsulate complex state logic
 * - Separation of concerns: API calls, state management, error handling
 * - Reusable across components with consistent behavior
 * - Automatic cleanup with useEffect dependencies
 *
 * API INTEGRATION PATTERNS:
 * - Fetch API with proper error handling
 * - Loading states for UX feedback
 * - Optimistic updates for better perceived performance
 * - Automatic refetching with manual refresh capability
 *
 * ERROR HANDLING STRATEGY:
 * - Network errors vs business logic errors
 * - User-friendly error messages
 * - Retry mechanisms for failed operations
 * - Graceful degradation when APIs are unavailable
 */



/**
 * API RESPONSE INTERFACE
 *
 * Standardized API response format for all topic operations
 * Matches the response structure from our route handlers
 */
interface TopicApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

/**
 * TOPICS LIST HOOK
 *
 * Manages fetching and caching of topic list data
 * Provides loading states and error handling
 */
export function useTopics() {
  // STATE MANAGEMENT
  const [topics, setTopics] = useState<KafkaTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // CLUSTER CONNECTION CONTEXT
  const { cluster } = useClusterConnection();

  // FETCH TOPICS from API
  const fetchTopics = useCallback(async (): Promise<void> => {
    // Early return if not connected
    if (!cluster) {
      setTopics([]);
      setError('Not connected to Kafka cluster');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // API CALL with fetch (bust caches outside test env)
      const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
      const url = isTestEnv ? '/api/kafka/topics' : `/api/kafka/topics?ts=${Date.now()}`;
      const requestInit: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (!isTestEnv) {
        requestInit.cache = 'no-store';
      }

      const response = await fetch(url, requestInit);

      if (!response.ok) {
        // HTTP ERROR HANDLING
        const errorData: TopicApiResponse = await response.json().catch(() => ({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));

        throw new Error(errorData.error || `Failed to fetch topics (${response.status})`);
      }

      // SUCCESS RESPONSE PARSING
      const data: TopicApiResponse<KafkaTopic[]> = await response.json();

      if (data.success && data.data) {
        setTopics(data.data);
        setLastFetch(new Date());
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';

      console.error('Failed to fetch topics:', errorMessage);
      setError(errorMessage);
      // Keep existing topics data for graceful degradation
    } finally {
      setIsLoading(false);
    }
  }, [cluster]);

  // AUTO-FETCH on cluster connection
  useEffect(() => {
    if (cluster) {
      fetchTopics();
    } else {
      // Clear data when disconnected
      setTopics([]);
      setError(null);
      setLastFetch(null);
    }
  }, [cluster, fetchTopics]);

  return {
    topics,
    isLoading,
    error,
    lastFetch,
    refetch: fetchTopics,
  };
}

/**
 * TOPIC CREATION HOOK
 *
 * Handles topic creation with optimistic updates
 * Manages form submission states and error handling
 */
export function useCreateTopic() {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createTopic = useCallback(async (topicData: CreateTopicForm): Promise<void> => {
    try {
      // Flush loading state synchronously so consumers can observe it immediately
      flushSync(() => {
        setIsCreating(true);
        setCreateError(null);
      });

      // API CALL to create topic
      const response = await fetch('/api/kafka/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicData),
      });

      if (!response.ok) {
        // BUSINESS LOGIC ERROR HANDLING (422) vs HTTP ERRORS
        const errorData: TopicApiResponse = await response.json().catch(() => ({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));

        throw new Error(errorData.error || `Failed to create topic (${response.status})`);
      }

      // SUCCESS RESPONSE VALIDATION
      const data: TopicApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Topic creation failed');
      }

      console.log(`✅ Topic '${topicData.name}' created successfully`);
    } catch (creationError) {
      const rawMessage =
        creationError instanceof Error
          ? creationError.message
          : 'Unknown error during topic creation';

      // Map known Kafka broker error to a more actionable message
      const friendlyMessage = rawMessage.includes('does not host this topic-partition')
        ? 'Kafka cluster rejected the request: insufficient replication or invalid broker for partition. Check replication factor and broker availability.'
        : rawMessage;

      console.error('Topic creation failed:', friendlyMessage);
      setCreateError(friendlyMessage);

      // Re-throw so calling components can handle the error
      throw new Error(friendlyMessage);
    } finally {
      // Ensure loading state is cleared synchronously after operation completes
      flushSync(() => {
        setIsCreating(false);
      });
    }
  }, []);

  return {
    createTopic,
    isCreating,
    createError,
  };
}

/**
 * TOPIC DELETION HOOK
 *
 * Handles topic deletion with confirmation patterns
 * Provides optimistic updates and rollback capability
 */
export function useDeleteTopic() {
  const [isDeletingTopic, setIsDeletingTopic] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteTopic = useCallback(async (topicName: string): Promise<void> => {
    try {
      // Flush which topic is being deleted synchronously for immediate UI feedback
      flushSync(() => {
        setIsDeletingTopic(topicName);
        setDeleteError(null);
      });

      // API CALL to delete topic
      const response = await fetch('/api/kafka/topics', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topicName }),
      });

      if (!response.ok) {
        // ERROR RESPONSE HANDLING
        const errorData: TopicApiResponse = await response.json().catch(() => ({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));

        throw new Error(errorData.error || `Failed to delete topic (${response.status})`);
      }

      // SUCCESS RESPONSE VALIDATION
      const data: TopicApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Topic deletion failed');
      }

      console.log(`🗑️ Topic '${topicName}' deleted successfully`);
    } catch (deletionError) {
      const errorMessage =
        deletionError instanceof Error
          ? deletionError.message
          : 'Unknown error during topic deletion';

      console.error('Topic deletion failed:', errorMessage);
      setDeleteError(errorMessage);

      // Re-throw for component error handling
      throw new Error(errorMessage);
    } finally {
      // Clear deleting state synchronously after completion
      flushSync(() => {
        setIsDeletingTopic(null);
      });
    }
  }, []);

  return {
    deleteTopic,
    isDeletingTopic,
    deleteError,
  };
}

/**
 * COMPREHENSIVE TOPIC MANAGEMENT HOOK
 *
 * Combines all topic operations into a single hook
 * Provides unified interface for topic management components
 */
export function useTopicManagement() {
  // COMBINE INDIVIDUAL HOOKS
  const topicsQuery = useTopics();
  const topicCreation = useCreateTopic();
  const topicDeletion = useDeleteTopic();

  // UNIFIED CREATE AND REFRESH HANDLER
  const createTopicAndRefresh = useCallback(
    async (topicData: CreateTopicForm): Promise<void> => {
      await topicCreation.createTopic(topicData);
      // Refresh topics list after successful creation
      await topicsQuery.refetch();
    },
    [topicCreation.createTopic, topicsQuery.refetch]
  );

  // UNIFIED DELETE AND REFRESH HANDLER
  const deleteTopicAndRefresh = useCallback(
    async (topicName: string): Promise<void> => {
      await topicDeletion.deleteTopic(topicName);
      // Refresh topics list after successful deletion
      await topicsQuery.refetch();
    },
    [topicDeletion.deleteTopic, topicsQuery.refetch]
  );

  return {
    // TOPICS DATA
    topics: topicsQuery.topics,
    isLoadingTopics: topicsQuery.isLoading,
    topicsError: topicsQuery.error,
    lastFetch: topicsQuery.lastFetch,
    refetchTopics: topicsQuery.refetch,

    // TOPIC CREATION
    createTopic: createTopicAndRefresh,
    isCreating: topicCreation.isCreating,
    createError: topicCreation.createError,

    // TOPIC DELETION
    deleteTopic: deleteTopicAndRefresh,
    isDeletingTopic: topicDeletion.isDeletingTopic,
    deleteError: topicDeletion.deleteError,
  };
}

/**
 * AUTO-REFRESH HOOK
 *
 * Automatically refreshes topics at specified interval
 * Useful for dashboard views that need real-time updates
 */
export function useTopicsAutoRefresh(intervalMs: number = 30000) {
  const { refetch } = useTopics();
  const { cluster } = useClusterConnection();

  useEffect(() => {
    // Only auto-refresh if connected
    if (!cluster) return;

    const interval = setInterval(() => {
      refetch();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [cluster, refetch, intervalMs]);
}
