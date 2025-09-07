/**
 * KAFKA CLUSTER OVERVIEW API ROUTE
 *
 * ENDPOINT: GET /api/kafka/cluster
 * PURPOSE: Returns comprehensive cluster metrics for dashboard
 *
 * CACHING STRATEGY:
 * - Cluster metadata changes infrequently
 * - Could implement Redis caching for better performance
 * - Current implementation: Real-time data on every request
 *
 * RESPONSE FORMAT:
 * - Structured JSON matching our TypeScript interfaces
 * - Consistent error handling across all endpoints
 * - HTTP status codes indicate operation success/failure
 */

import { NextResponse } from 'next/server';
import { kafkaService } from '@/lib/kafka-service';

/**
 * GET /api/kafka/cluster
 *
 * Fetches comprehensive cluster overview including:
 * - Broker count and status
 * - Topic and partition counts
 * - Consumer group information
 * - Overall cluster health
 *
 * AUTHENTICATION CHECK:
 * - Ensures client is connected before fetching data
 * - Returns 401 if no active connection
 *
 * ERROR HANDLING:
 * - Network timeouts: Graceful degradation
 * - Kafka API errors: User-friendly messages
 * - Unexpected errors: Logged for debugging
 */
export async function GET() {
  try {
    // CONNECTION STATUS CHECK
    if (!kafkaService.isConnectionActive()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not connected to Kafka cluster',
          message: 'Please establish a connection first',
        },
        { status: 401 } // Unauthorized - connection required
      );
    }

    // FETCH CLUSTER OVERVIEW METRICS
    // This aggregates data from multiple Kafka APIs
    try {
      const overview = await kafkaService.getClusterOverview();

      // SUCCESS RESPONSE with cluster metrics
      return NextResponse.json({
        success: true,
        data: overview,
        timestamp: new Date().toISOString(),
      });
    } catch (kafkaError) {
      // KAFKA API ERRORS
      // These might be temporary (network issues) or configuration problems
      const errorMessage =
        kafkaError instanceof Error ? kafkaError.message : 'Failed to fetch cluster information';

      console.warn('Kafka API error in cluster overview:', errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          // Provide fallback data structure for graceful degradation
          data: {
            brokersOnline: 0,
            brokersTotal: 0,
            topicsCount: 0,
            partitionsCount: 0,
            consumerGroupsCount: 0,
            messagesPerSecond: 0,
            status: 'unknown' as const,
          },
        },
        { status: 503 } // Service Unavailable - temporary issue
      );
    }
  } catch (error) {
    // UNEXPECTED SERVER ERRORS
    console.error('Unexpected error in /api/kafka/cluster:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching cluster information',
      },
      { status: 500 }
    );
  }
}
