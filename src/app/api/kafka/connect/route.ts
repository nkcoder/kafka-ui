/**
 * KAFKA CONNECTION API ROUTE
 *
 * NEXT.JS APP ROUTER API ROUTES:
 * - File location: /app/api/kafka/connect/route.ts
 * - Creates endpoint: POST /api/kafka/connect
 * - Server-side execution: Runs in Node.js, not browser
 * - Named exports: GET, POST, PUT, DELETE functions
 *
 * HTTP METHOD PATTERNS:
 * - POST: Create/establish connection (idempotent operation)
 * - Request body: Connection parameters (bootstrap servers, client ID)
 * - Response: Success/error with connection status
 *
 * ERROR HANDLING STRATEGY:
 * - Try/catch with specific HTTP status codes
 * - User-friendly error messages for common issues
 * - Structured JSON responses for frontend consumption
 */

import { NextRequest, NextResponse } from 'next/server';
import { kafkaService } from '@/lib/kafka-service';
import { connectionFormSchema } from '@/types/schemas';

/**
 * POST /api/kafka/connect
 *
 * Establishes connection to Kafka cluster using provided configuration
 *
 * REQUEST BODY VALIDATION:
 * - Uses Zod schema for runtime validation
 * - Ensures bootstrap servers format is correct
 * - Validates required fields are present
 */
export async function POST(request: NextRequest) {
  try {
    // PARSE REQUEST BODY with error handling
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 } // Bad Request
      );
    }

    // VALIDATE REQUEST DATA using Zod schema
    const validationResult = connectionFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid connection parameters',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 } // Bad Request
      );
    }

    const { name, bootstrapServers } = validationResult.data;

    // ATTEMPT KAFKA CONNECTION
    // This is where the real Kafka integration happens
    try {
      await kafkaService.connect(bootstrapServers, 'kafka-ui-client');

      // SUCCESS RESPONSE with connection details
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Kafka cluster',
        data: {
          id: crypto.randomUUID(), // Generate unique ID for this connection
          name,
          bootstrapServers,
          status: 'connected',
          version: '4.0.0',
          controllerId: 'unknown',
        },
      });
    } catch (connectionError) {
      // KAFKA CONNECTION ERRORS
      // These are business logic errors, not HTTP errors
      const errorMessage =
        connectionError instanceof Error
          ? connectionError.message
          : 'Failed to connect to Kafka cluster';

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          // Additional context for debugging
          details: {
            bootstrapServers,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 422 } // Unprocessable Entity - valid request but business logic failed
      );
    }
  } catch (error) {
    // UNEXPECTED SERVER ERRORS
    console.error('Unexpected error in /api/kafka/connect:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while connecting to Kafka',
      },
      { status: 500 } // Internal Server Error
    );
  }
}

/**
 * GET /api/kafka/connect
 *
 * Returns current connection status
 * Useful for checking if already connected before attempting new connection
 */
export async function GET() {
  try {
    const isConnected = kafkaService.isConnectionActive();
    const connectionInfo = kafkaService.getConnectionInfo();

    if (isConnected && connectionInfo) {
      return NextResponse.json({
        success: true,
        data: {
          connected: true,
          connection: {
            brokers: connectionInfo.brokers,
            clientId: connectionInfo.clientId,
            status: 'active',
          },
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          message: 'No active Kafka connection',
        },
      });
    }
  } catch (error) {
    console.error('Error checking connection status:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check connection status',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/kafka/connect
 *
 * Disconnects from current Kafka cluster
 * Cleanup operation to free resources
 */
export async function DELETE() {
  try {
    await kafkaService.disconnect();

    return NextResponse.json({
      success: true,
      message: 'Disconnected from Kafka cluster',
    });
  } catch (error) {
    console.error('Error disconnecting from Kafka:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect from Kafka cluster',
      },
      { status: 500 }
    );
  }
}
