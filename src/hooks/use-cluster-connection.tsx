/**
 * CLUSTER CONNECTION STATE MANAGEMENT
 *
 * REACT CONTEXT PATTERN EXPLAINED:
 * - createContext: Creates context object for sharing state across component tree
 * - useContext: Hook to consume context values in child components
 * - Provider pattern: Wraps app/component tree to provide shared state
 * - Custom hook: Encapsulates context usage with error handling
 *
 * STATE MANAGEMENT ARCHITECTURE:
 * - Local state with useState for simple cluster connection
 * - Could be replaced with Zustand/Redux for complex state needs
 * - Demonstrates lifting state up to share across multiple components
 *
 * TYPESCRIPT CONTEXT TYPING:
 * - Interface defines context shape for type safety
 * - Optional context value with null check prevents runtime errors
 * - Generic types ensure proper type inference
 */

'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getErrorMessage, kafkaApi } from '@/lib/api-client';
import { ConnectionForm, KafkaCluster } from '@/types/schemas';

// TYPESCRIPT INTERFACE for context value shape
interface ClusterContextValue {
  // Current connection state
  cluster: KafkaCluster | null;
  isConnecting: boolean;
  connectionError: string | null;

  // Action functions
  connect: (connectionData: ConnectionForm) => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

// CREATE REACT CONTEXT with initial null value
// Context allows passing data through component tree without prop drilling
const ClusterContext = createContext<ClusterContextValue | null>(null);

// PROVIDER COMPONENT props interface
interface ClusterProviderProps {
  children: ReactNode; // React's children pattern for wrapping components
}

// CLUSTER PROVIDER COMPONENT
export function ClusterProvider({ children }: ClusterProviderProps) {
  // LOCAL STATE MANAGEMENT using React hooks
  const [cluster, setCluster] = useState<KafkaCluster | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // CONNECTION FUNCTION with real Kafka API integration
  const connect = useCallback(async (connectionData: ConnectionForm) => {
    try {
      setIsConnecting(true); // Set loading state
      setConnectionError(null); // Clear previous errors

      // REAL API CALL to Next.js backend
      const clusterInfo = await kafkaApi.connect(connectionData);

      // SUCCESS: Create cluster object with real data from API
      const newCluster: KafkaCluster = {
        id: clusterInfo.id || crypto.randomUUID(),
        name: connectionData.name,
        bootstrapServers: connectionData.bootstrapServers,
        status: 'connected',
        version: '4.0.0', // Your Kafka version
        controllerId: 'unknown', // Will be populated by cluster metadata
      };

      setCluster(newCluster);

      // PERSISTENCE: Save connection info to localStorage
      localStorage.setItem('kafka-cluster', JSON.stringify(newCluster));
    } catch (error) {
      // ERROR HANDLING: API errors are already user-friendly
      const message = getErrorMessage(error);
      setConnectionError(message);
      setCluster(null); // Clear cluster on error
    } finally {
      setIsConnecting(false); // Reset loading state in all cases
    }
  }, []); // Empty dependency array - function never recreated

  // DISCONNECT FUNCTION - clears all connection state
  const disconnect = useCallback(async () => {
    try {
      // Call API to disconnect from Kafka cluster
      await kafkaApi.disconnect();

      setCluster(null);
      setConnectionError(null);
      localStorage.removeItem('kafka-cluster'); // Remove persisted connection
    } catch (error) {
      // Log error but still clear local state
      console.error('Error disconnecting from Kafka:', error);
      setCluster(null);
      setConnectionError(null);
      localStorage.removeItem('kafka-cluster');
    }
  }, []);

  // CLEAR ERROR FUNCTION - for manual error dismissal
  const clearError = useCallback(() => {
    setConnectionError(null);
  }, []);

  // RESTORE CONNECTION from localStorage on component mount
  useEffect(() => {
    const restoreConnection = async () => {
      try {
        // Check if there's a saved connection
        const savedCluster = localStorage.getItem('kafka-cluster');
        if (savedCluster) {
          const parsedCluster = JSON.parse(savedCluster) as KafkaCluster;

          // Verify the connection is still active on server
          const status = await kafkaApi.getConnectionStatus();
          if (status.connected && status.connection) {
            // Server still has connection, restore frontend state
            setCluster({
              ...parsedCluster,
              bootstrapServers: status.connection.brokers, // Use current server info
            });
          } else {
            // Server connection lost, clear saved data
            localStorage.removeItem('kafka-cluster');
          }
        }
      } catch (error) {
        console.warn('Failed to restore connection:', error);
        localStorage.removeItem('kafka-cluster'); // Remove invalid data
      }
    };

    restoreConnection();
  }, []); // Run once on mount

  // CONTEXT VALUE OBJECT - memoized for performance optimization
  const value: ClusterContextValue = useMemo(
    () => ({
      cluster,
      isConnecting,
      connectionError,
      connect,
      disconnect,
      clearError,
    }),
    [cluster, isConnecting, connectionError, connect, disconnect, clearError]
  );

  // PROVIDER WRAPPER - makes context available to all children
  return (
    <ClusterContext.Provider value={value}>
      {children} {/* Render child components with access to context */}
    </ClusterContext.Provider>
  );
}

// CUSTOM HOOK for consuming cluster context
// This pattern encapsulates context usage and provides better error messages
export function useClusterConnection() {
  const context = useContext(ClusterContext);

  // ERROR HANDLING: Ensure hook is used within provider
  if (!context) {
    throw new Error('useClusterConnection must be used within ClusterProvider');
    // This prevents runtime errors from forgetting to wrap components in provider
  }

  return context;
}

// INITIALIZE CONNECTION from localStorage (for demo persistence)
// In real app, you might restore from secure token or server session
export function useInitializeConnection() {
  const [cluster, setCluster] = useState<KafkaCluster | null>(null);

  // EFFECT: Run once on component mount to restore connection
  useEffect(() => {
    const savedCluster = localStorage.getItem('kafka-cluster');
    if (savedCluster) {
      try {
        const parsedCluster = JSON.parse(savedCluster) as KafkaCluster;
        // In real app, you'd validate the stored connection is still active
        setCluster(parsedCluster);
      } catch (error) {
        console.error('Failed to restore cluster connection:', error);
        localStorage.removeItem('kafka-cluster'); // Remove invalid data
      }
    }
  }, []);

  return cluster;
}
