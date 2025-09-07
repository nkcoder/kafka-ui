/**
 * ENVIRONMENT VARIABLES VALIDATION
 *
 * NEXT.JS ENVIRONMENT PATTERNS:
 * - Server-side: All process.env variables available
 * - Client-side: Only NEXT_PUBLIC_ prefixed variables available
 * - Build-time validation prevents runtime configuration errors
 *
 * VALIDATION STRATEGY:
 * - Zod schema for runtime type checking
 * - Provides defaults for optional variables
 * - Throws descriptive errors for missing required variables
 * - Separates server and client environments
 */

import { z } from 'zod';

// SERVER-SIDE ENVIRONMENT SCHEMA
const serverEnvSchema = z.object({
  // Kafka Configuration
  KAFKA_BOOTSTRAP_SERVERS: z.string().optional(),
  KAFKA_CLIENT_ID: z.string().optional(),
  KAFKA_CLUSTER_NAME: z.string().optional(),
  KAFKA_CONNECTION_TIMEOUT: z.string().optional(),
  KAFKA_REQUEST_TIMEOUT: z.string().optional(),
  KAFKA_METRICS_REFRESH_INTERVAL: z.string().optional(),

  // Node.js Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// CLIENT-SIDE ENVIRONMENT SCHEMA
const clientEnvSchema = z.object({
  NEXT_PUBLIC_KAFKA_CLUSTER_NAME: z.string().optional(),
});

// VALIDATE SERVER ENVIRONMENT
function validateServerEnv() {
  try {
    return serverEnvSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid server environment variables:', error);
    throw new Error('Server environment validation failed');
  }
}

// VALIDATE CLIENT ENVIRONMENT
function validateClientEnv() {
  const clientEnv = {
    NEXT_PUBLIC_KAFKA_CLUSTER_NAME: process.env.NEXT_PUBLIC_KAFKA_CLUSTER_NAME,
  };

  try {
    return clientEnvSchema.parse(clientEnv);
  } catch (error) {
    console.error('❌ Invalid client environment variables:', error);
    throw new Error('Client environment validation failed');
  }
}

// EXPORT VALIDATED ENVIRONMENTS
export const serverEnv = validateServerEnv();
export const clientEnv = validateClientEnv();

// TYPE EXPORTS for TypeScript
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
