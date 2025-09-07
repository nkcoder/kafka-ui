/**
 * TOPIC HOOKS TESTS
 *
 * TESTING CUSTOM REACT HOOKS:
 * - @testing-library/react-hooks for hook testing
 * - renderHook utility for isolated hook testing
 * - act utility for state updates and async operations
 * - Mock fetch API for network requests
 * - Test loading states, error handling, and success scenarios
 *
 * REACT TESTING PATTERNS:
 * - Mock external dependencies (fetch, context)
 * - Test hook state transitions
 * - Verify side effects (API calls)
 * - Test error boundaries and recovery
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClusterProvider } from '../use-cluster-connection';
import { useCreateTopic, useDeleteTopic, useTopicManagement, useTopics } from '../use-topics';

// MOCK FETCH API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// MOCK CLUSTER CONNECTION CONTEXT
const mockCluster = {
  id: 'test-cluster',
  name: 'Test Cluster',
  bootstrapServers: 'localhost:9092',
  status: 'connected' as const,
};

// TEST WRAPPER with providers
function TestWrapper({ children }: { children: ReactNode }) {
  return <ClusterProvider>{children}</ClusterProvider>;
}

// MOCK useClusterConnection hook
vi.mock('../use-cluster-connection', () => ({
  useClusterConnection: vi.fn(() => ({
    cluster: mockCluster,
    isConnecting: false,
  })),
  ClusterProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('useTopics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods to avoid test output pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch topics successfully', async () => {
    // ARRANGE: Mock successful API response
    const mockTopics = [
      {
        name: 'test-topic',
        partitions: 3,
        replicationFactor: 1,
        config: {},
        metrics: { messageCount: 1000, sizeBytes: 50000, consumerLag: 10 },
        status: 'active',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTopics,
      }),
    });

    // ACT: Render hook
    const { result } = renderHook(() => useTopics(), { wrapper: TestWrapper });

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // ASSERT: Verify state
    expect(result.current.topics).toEqual(mockTopics);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetch).toBeInstanceOf(Date);

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/kafka/topics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should handle API error gracefully', async () => {
    // ARRANGE: Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        error: 'Service unavailable',
      }),
    });

    // ACT
    const { result } = renderHook(() => useTopics(), { wrapper: TestWrapper });

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // ASSERT
    expect(result.current.topics).toEqual([]);
    expect(result.current.error).toContain('Service unavailable');
  });

  it('should handle network error', async () => {
    // ARRANGE: Mock network failure
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // ACT
    const { result } = renderHook(() => useTopics(), { wrapper: TestWrapper });

    // Wait for error to be set
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // ASSERT
    expect(result.current.error).toContain('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  it('should refetch topics when requested', async () => {
    // ARRANGE: Mock multiple API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              name: 'new-topic',
              partitions: 1,
              replicationFactor: 1,
              config: {},
              metrics: {},
              status: 'active',
            },
          ],
        }),
      });

    // ACT: Render hook and wait for initial fetch
    const { result } = renderHook(() => useTopics(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Refetch
    await act(async () => {
      await result.current.refetch();
    });

    // ASSERT: Verify refetch was called
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.topics).toHaveLength(1);
    expect(result.current.topics[0].name).toBe('new-topic');
  });
});

describe('useCreateTopic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should create topic successfully', async () => {
    // ARRANGE
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: "Topic 'new-topic' created successfully",
      }),
    });

    const { result } = renderHook(() => useCreateTopic());

    // ACT
    const topicData = {
      name: 'new-topic',
      partitions: 3,
      replicationFactor: 1,
      config: {},
    };

    await act(async () => {
      await result.current.createTopic(topicData);
    });

    // ASSERT
    expect(result.current.isCreating).toBe(false);
    expect(result.current.createError).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/kafka/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(topicData),
    });
  });

  it('should handle creation error', async () => {
    // ARRANGE
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        success: false,
        error: 'Topic already exists',
      }),
    });

    const { result } = renderHook(() => useCreateTopic());

    // ACT & ASSERT: Expect error to be thrown
    await act(async () => {
      await expect(
        result.current.createTopic({
          name: 'existing-topic',
          partitions: 1,
          replicationFactor: 1,
        })
      ).rejects.toThrow('Topic already exists');
    });

    expect(result.current.createError).toBe('Topic already exists');
    expect(result.current.isCreating).toBe(false);
  });

  it('should manage loading state correctly', async () => {
    // ARRANGE: Mock slow response using a resolver ref to satisfy TS definite assignment
    const resolverRef: { resolve: (value: unknown) => void } = { resolve: () => {} };
    const responsePromise = new Promise((resolve) => {
      resolverRef.resolve = resolve;
    });

    mockFetch.mockReturnValueOnce(responsePromise);

    const { result } = renderHook(() => useCreateTopic());

    // ACT: Start creation
    const createPromise = act(async () => {
      return result.current.createTopic({
        name: 'test-topic',
        partitions: 1,
        replicationFactor: 1,
      });
    });

    // ASSERT: Should be loading
    await waitFor(() => {
      expect(result.current.isCreating).toBe(true);
    });

    // Complete the request
    resolverRef.resolve({
      ok: true,
      json: async () => ({ success: true }),
    });

    await createPromise;

    // ASSERT: Should not be loading
    expect(result.current.isCreating).toBe(false);
  });
});

describe('useDeleteTopic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should delete topic successfully', async () => {
    // ARRANGE
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: "Topic 'test-topic' deleted successfully",
      }),
    });

    const { result } = renderHook(() => useDeleteTopic());

    // ACT
    await act(async () => {
      if (result.current?.deleteTopic) {
        await result.current.deleteTopic('test-topic');
      }
    });

    // ASSERT
    await waitFor(() => {
      expect(result.current?.isDeletingTopic).toBeNull();
      expect(result.current?.deleteError).toBeNull();
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/kafka/topics', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topicName: 'test-topic' }),
    });
  });

  it('should track which topic is being deleted', async () => {
    // ARRANGE: Mock slow response using a resolver ref to satisfy TS definite assignment
    const resolverRef: { resolve: (value: unknown) => void } = { resolve: () => {} };
    const responsePromise = new Promise((resolve) => {
      resolverRef.resolve = resolve;
    });

    mockFetch.mockReturnValueOnce(responsePromise);

    const { result } = renderHook(() => useDeleteTopic());

    // ACT: Start deletion
    const deletePromise = act(async () => {
      if (result.current?.deleteTopic) {
        return result.current.deleteTopic('test-topic');
      }
    });

    // ASSERT: Should track the deleting topic
    await waitFor(() => {
      expect(result.current?.isDeletingTopic).toBe('test-topic');
    });

    // Complete the request
    resolverRef.resolve({
      ok: true,
      json: async () => ({ success: true }),
    });

    await deletePromise;

    // ASSERT: Should clear deleting state
    await waitFor(() => {
      expect(result.current?.isDeletingTopic).toBeNull();
    });
  });
});

describe('useTopicManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should integrate all topic operations', async () => {
    // ARRANGE: Mock all API calls
    mockFetch
      // Initial topics fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      // Create topic
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      // Refetch after create
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              name: 'new-topic',
              partitions: 1,
              replicationFactor: 1,
              config: {},
              metrics: {},
              status: 'active',
            },
          ],
        }),
      });

    const { result } = renderHook(() => useTopicManagement(), { wrapper: TestWrapper });

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current?.isLoadingTopics).toBe(false);
    });

    // ACT: Create topic
    await act(async () => {
      if (result.current?.createTopic) {
        await result.current.createTopic({
          name: 'new-topic',
          partitions: 1,
          replicationFactor: 1,
        });
      }
    });

    // ASSERT: Should have refreshed topics list
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial fetch + create + refetch
    expect(result.current?.topics).toHaveLength(1);
    expect(result.current?.topics[0].name).toBe('new-topic');
  });
});
