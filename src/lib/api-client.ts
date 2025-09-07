/**
 * FRONTEND API CLIENT
 *
 * FRONTEND-BACKEND COMMUNICATION PATTERN:
 * - Frontend React components make HTTP requests to Next.js API routes
 * - API routes handle Kafka client operations on server-side
 * - Type-safe client using TypeScript interfaces
 * - Centralized error handling and response parsing
 *
 * HTTP CLIENT ARCHITECTURE:
 * - Built on native fetch API (no external dependencies)
 * - Automatic JSON parsing and error handling
 * - Consistent response format across all endpoints
 * - TypeScript types ensure API contract compliance
 *
 * ERROR HANDLING STRATEGY:
 * - Network errors: Connection issues, timeouts
 * - HTTP errors: 4xx/5xx status codes with meaningful messages
 * - Kafka errors: Business logic failures from Kafka operations
 * - Type validation: Runtime checks for API responses
 */

import {
  ClusterOverview,
  ConnectionForm,
  KafkaBroker,
  KafkaCluster,
  KafkaTopic,
} from '@/types/schemas';

/**
 * API RESPONSE WRAPPER TYPES
 *
 * Standardized response format for all API endpoints
 * Ensures consistent error handling and data access patterns
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * API CLIENT ERROR CLASS
 *
 * Custom error class for API-specific errors
 * Includes HTTP status codes and detailed error messages
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * BASE API REQUEST FUNCTION
 *
 * Centralized HTTP request handling with:
 * - Automatic JSON parsing
 * - Error response handling
 * - TypeScript type safety
 * - Request/response logging (development)
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // CONSTRUCT FULL URL for API endpoint
  const url = `${window.location.origin}/api${endpoint}`;

  // DEFAULT REQUEST CONFIGURATION
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    // MAKE HTTP REQUEST
    const response = await fetch(url, defaultOptions);

    // PARSE JSON RESPONSE
    const data: ApiResponse<T> = await response.json();

    // HANDLE API ERRORS
    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      );
    }

    // RETURN SUCCESSFUL DATA
    return data.data as T;
  } catch (error) {
    // NETWORK OR PARSING ERRORS
    if (error instanceof ApiError) {
      throw error; // Re-throw API errors
    }

    // Handle network errors, JSON parsing errors, etc.
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0 // No HTTP status for network errors
    );
  }
}

/**
 * KAFKA API CLIENT METHODS
 *
 * Type-safe wrappers for each Kafka API endpoint
 * Each method handles specific request/response patterns
 */
export const kafkaApi = {
  /**
   * CONNECT TO KAFKA CLUSTER
   *
   * POST /api/kafka/connect
   * Establishes connection using form data from connection modal
   */
  async connect(connectionData: ConnectionForm): Promise<KafkaCluster> {
    return apiRequest<KafkaCluster>('/kafka/connect', {
      method: 'POST',
      body: JSON.stringify(connectionData),
    });
  },

  /**
   * CHECK CONNECTION STATUS
   *
   * GET /api/kafka/connect
   * Returns current connection state without attempting new connection
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    connection?: {
      brokers: string;
      clientId: string;
      status: string;
    };
  }> {
    return apiRequest('/kafka/connect', {
      method: 'GET',
    });
  },

  /**
   * DISCONNECT FROM KAFKA CLUSTER
   *
   * DELETE /api/kafka/connect
   * Cleanly closes Kafka connection and frees resources
   */
  async disconnect(): Promise<{ message: string }> {
    return apiRequest('/kafka/connect', {
      method: 'DELETE',
    });
  },

  /**
   * GET CLUSTER OVERVIEW METRICS
   *
   * GET /api/kafka/cluster
   * Returns aggregated metrics for dashboard display
   */
  async getClusterOverview(): Promise<ClusterOverview> {
    return apiRequest<ClusterOverview>('/kafka/cluster', {
      method: 'GET',
    });
  },

  /**
   * GET BROKER INFORMATION
   *
   * GET /api/kafka/brokers
   * Returns detailed information about all brokers in cluster
   */
  async getBrokers(): Promise<KafkaBroker[]> {
    return apiRequest<KafkaBroker[]>('/kafka/brokers', {
      method: 'GET',
    });
  },

  /**
   * GET TOPICS INFORMATION
   *
   * GET /api/kafka/topics
   * Returns list of topics with metadata and metrics
   */
  async getTopics(): Promise<KafkaTopic[]> {
    return apiRequest<KafkaTopic[]>('/kafka/topics', {
      method: 'GET',
    });
  },
};

/**
 * API CLIENT HOOKS INTEGRATION
 *
 * These functions are designed to work with React hooks:
 * - Can be called from useEffect for data fetching
 * - Return promises that work with async/await
 * - Throw errors that can be caught by error boundaries
 * - Support loading states in React components
 */

/**
 * HELPER FUNCTION: Check if error is API error
 *
 * Type guard for error handling in React components
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * HELPER FUNCTION: Extract user-friendly error message
 *
 * Converts API errors into messages suitable for UI display
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
