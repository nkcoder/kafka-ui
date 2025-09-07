/**
 * CLUSTER CONNECTION HOOK TESTS
 *
 * REACT HOOKS TESTING PATTERNS:
 * - renderHook() for isolated hook testing
 * - act() for state updates and async operations
 * - Mock API calls with vi.mock()
 * - Test context provider functionality
 * - Test localStorage persistence
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as apiClient from '@/lib/api-client';
import { ClusterProvider, useClusterConnection } from '../use-cluster-connection';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  kafkaApi: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    getConnectionStatus: vi.fn(),
  },
  getErrorMessage: vi.fn((error) => error?.message || 'Unknown error'),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-123'),
});

const mockKafkaApi = apiClient.kafkaApi as unknown as {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  getConnectionStatus: ReturnType<typeof vi.fn>;
};

// Test wrapper component
const wrapper = ({ children }: { children: ReactNode }) => (
  <ClusterProvider>{children}</ClusterProvider>
);

describe('useClusterConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('initial state is disconnected', () => {
    const { result } = renderHook(() => useClusterConnection(), { wrapper });

    expect(result.current.cluster).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.connectionError).toBeNull();
  });

  test('connect function establishes connection successfully', async () => {
    const mockCluster = {
      id: 'test-uuid-123',
      name: 'Test Cluster',
      bootstrapServers: 'localhost:9092',
      status: 'connected' as const,
      version: '4.0.0',
      controllerId: 'unknown',
    };

    mockKafkaApi.connect.mockResolvedValueOnce(mockCluster);

    const { result } = renderHook(() => useClusterConnection(), { wrapper });

    await act(async () => {
      await result.current.connect({
        name: 'Test Cluster',
        bootstrapServers: 'localhost:9092',
      });
    });

    expect(result.current.cluster).toEqual(mockCluster);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.connectionError).toBeNull();
  });

  test('connect function handles errors', async () => {
    const errorMessage = 'Connection failed';
    mockKafkaApi.connect.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useClusterConnection(), { wrapper });

    await act(async () => {
      await result.current.connect({
        name: 'Test Cluster',
        bootstrapServers: 'localhost:9092',
      });
    });

    expect(result.current.cluster).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.connectionError).toBe(errorMessage);
  });

  test('disconnect function clears connection state', async () => {
    // First establish a connection
    const mockCluster = {
      id: 'test-uuid-123',
      name: 'Test Cluster',
      bootstrapServers: 'localhost:9092',
      status: 'connected' as const,
      version: '4.0.0',
      controllerId: 'unknown',
    };

    mockKafkaApi.connect.mockResolvedValueOnce(mockCluster);
    mockKafkaApi.disconnect.mockResolvedValueOnce({ message: 'Disconnected' });

    const { result } = renderHook(() => useClusterConnection(), { wrapper });

    await act(async () => {
      await result.current.connect({
        name: 'Test Cluster',
        bootstrapServers: 'localhost:9092',
      });
    });

    // Then disconnect
    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.cluster).toBeNull();
    expect(result.current.connectionError).toBeNull();
  });

  test('restores connection from localStorage on mount', async () => {
    const savedCluster = {
      id: 'test-uuid-123',
      name: 'Saved Cluster',
      bootstrapServers: 'localhost:9092',
      status: 'connected',
      version: '4.0.0',
      controllerId: 'unknown',
    };

    // Mock localStorage.getItem to return the saved cluster
    vi.mocked(localStorage.getItem).mockReturnValueOnce(JSON.stringify(savedCluster));

    mockKafkaApi.getConnectionStatus.mockResolvedValueOnce({
      connected: true,
      connection: {
        brokers: 'localhost:9092',
        clientId: 'kafka-ui-development',
        status: 'active',
      },
    });

    const { result } = renderHook(() => useClusterConnection(), { wrapper });

    await waitFor(() => {
      expect(result.current.cluster).not.toBeNull();
    });

    expect(result.current.cluster?.name).toBe('Saved Cluster'); // Preserves saved name
    expect(result.current.cluster?.bootstrapServers).toBe('localhost:9092');
  });

  test('clears localStorage when server connection is lost', async () => {
    const savedCluster = {
      id: 'test-uuid-123',
      name: 'Saved Cluster',
      bootstrapServers: 'localhost:9092',
      status: 'connected',
      version: '4.0.0',
      controllerId: 'unknown',
    };

    // Mock localStorage.getItem to return the saved cluster
    vi.mocked(localStorage.getItem).mockReturnValueOnce(JSON.stringify(savedCluster));

    mockKafkaApi.getConnectionStatus.mockResolvedValueOnce({
      connected: false,
      message: 'No active connection',
    });

    renderHook(() => useClusterConnection(), { wrapper });

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('kafka-cluster');
    });
  });

  test('clearError function clears connection error', async () => {
    const errorMessage = 'Connection failed';
    mockKafkaApi.connect.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useClusterConnection(), { wrapper });

    // Create an error
    await act(async () => {
      await result.current.connect({
        name: 'Test Cluster',
        bootstrapServers: 'localhost:9092',
      });
    });

    expect(result.current.connectionError).toBe(errorMessage);

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.connectionError).toBeNull();
  });
});
