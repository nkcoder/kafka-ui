/**
 * KAFKA BROKERS API ROUTE
 *
 * ENDPOINT: GET /api/kafka/brokers
 * PURPOSE: Returns detailed information about each broker in the cluster
 *
 * BROKER INFORMATION INCLUDES:
 * - Broker ID, host, port, and rack assignment
 * - Online/offline status and controller identification
 * - Resource utilization metrics (disk, network, CPU)
 * - Configuration settings (future enhancement)
 *
 * REAL-TIME vs CACHED DATA:
 * - Broker topology changes rarely - good candidate for caching
 * - Metrics change frequently - might need real-time updates
 * - Current implementation: Real-time for accuracy
 */

import { NextResponse } from 'next/server';
import { kafkaService } from '@/lib/kafka-service';

/**
 * GET /api/kafka/brokers
 *
 * Returns array of broker information for broker management interface
 */
export async function GET() {
  try {
    // VERIFY KAFKA CONNECTION
    if (!kafkaService.isConnectionActive()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not connected to Kafka cluster',
          message: 'Please establish a connection to view brokers',
        },
        { status: 401 }
      );
    }

    // FETCH BROKER INFORMATION
    try {
      const brokers = await kafkaService.getBrokers();

      return NextResponse.json({
        success: true,
        data: brokers,
        count: brokers.length,
        timestamp: new Date().toISOString(),
      });
    } catch (kafkaError) {
      const errorMessage =
        kafkaError instanceof Error ? kafkaError.message : 'Failed to fetch broker information';

      console.warn('Kafka API error fetching brokers:', errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          data: [], // Empty array for graceful degradation
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in /api/kafka/brokers:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch broker information',
      },
      { status: 500 }
    );
  }
}
