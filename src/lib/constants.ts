/**
 * APPLICATION CONSTANTS
 *
 * Centralized constants for configuration, timeouts, and magic values
 * Following Next.js/React best practices for maintainable code
 */

// KAFKA CONNECTION CONFIGURATION
export const KAFKA_CONFIG = {
  DEFAULT_SERVERS: 'localhost:9092',
  DEFAULT_CLIENT_ID: 'kafka-ui-client',
  CONNECTION_TIMEOUT: 10000,
  REQUEST_TIMEOUT: 30000,
  DEFAULT_VERSION: '4.0.0',
  UNKNOWN_CONTROLLER: 'unknown',
} as const;

// UI CONFIGURATION
export const UI_CONFIG = {
  AUTO_REFRESH_INTERVAL: 30, // seconds
  TOAST_DURATION: 5000, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
} as const;

// LOCAL STORAGE KEYS
export const STORAGE_KEYS = {
  KAFKA_CLUSTER: 'kafka-cluster',
  USER_PREFERENCES: 'user-preferences',
} as const;

// API ENDPOINTS
export const API_ENDPOINTS = {
  KAFKA_CONNECT: '/kafka/connect',
  KAFKA_CLUSTER: '/kafka/cluster',
  KAFKA_BROKERS: '/kafka/brokers',
  KAFKA_TOPICS: '/kafka/topics',
} as const;

// RETRY CONFIGURATION
export const RETRY_CONFIG = {
  INITIAL_RETRY_TIME: 100,
  MAX_RETRIES: 8,
  EXPONENTIAL_BACKOFF: 2,
} as const;
