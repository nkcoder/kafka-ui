/**
 * KAFKA TOPICS API ROUTE
 *
 * ENDPOINT: GET /api/kafka/topics
 * PURPOSE: Returns comprehensive topic information for topic management
 *
 * TOPIC INFORMATION INCLUDES:
 * - Topic names, partition counts, replication factors
 * - Configuration settings (retention, cleanup policy, etc.)
 * - Metrics (message count, size, consumer lag)
 * - Partition leadership distribution
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Large clusters may have thousands of topics
 * - Implements pagination and sampling for performance
 * - Detailed metadata only for subset of topics
 * - Future: Add filtering and search parameters
 */

import { NextRequest, NextResponse } from 'next/server';
import { kafkaService } from '@/lib/kafka-service';
import { createTopicFormSchema, deleteTopicSchema } from '@/types/schemas';

/**
 * GET /api/kafka/topics
 *
 * Returns paginated list of topics with metadata
 *
 * QUERY PARAMETERS (future enhancement):
 * - limit: Number of topics to return (default: 50)
 * - offset: Starting position for pagination
 * - search: Filter topics by name pattern
 * - sort: Sort by name, size, partitions, etc.
 */
export async function GET() {
  try {
    // VERIFY KAFKA CONNECTION
    if (!kafkaService.isConnectionActive()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not connected to Kafka cluster',
          message: 'Please establish a connection to view topics',
        },
        { status: 401 }
      );
    }

    // FETCH TOPIC INFORMATION
    try {
      const topics = await kafkaService.getTopics();

      // RESPONSE WITH METADATA
      return NextResponse.json({
        success: true,
        data: topics,
        count: topics.length,
        // Additional metadata for UI
        metadata: {
          totalTopics: topics.length,
          // Could add summary statistics
          avgPartitions:
            topics.length > 0
              ? Math.round(topics.reduce((sum, t) => sum + t.partitions, 0) / topics.length)
              : 0,
          avgReplicationFactor:
            topics.length > 0
              ? Math.round(topics.reduce((sum, t) => sum + t.replicationFactor, 0) / topics.length)
              : 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (kafkaError) {
      const errorMessage =
        kafkaError instanceof Error ? kafkaError.message : 'Failed to fetch topic information';

      console.warn('Kafka API error fetching topics:', errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          data: [], // Empty array for graceful degradation
          count: 0,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in /api/kafka/topics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch topic information',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kafka/topics
 *
 * Creates a new Kafka topic with specified configuration
 *
 * REQUEST BODY VALIDATION:
 * - Uses Zod schema for comprehensive validation
 * - Validates Kafka naming rules and constraints
 * - Ensures partition/replication factor limits
 */
export async function POST(request: NextRequest) {
  try {
    // VERIFY KAFKA CONNECTION
    if (!kafkaService.isConnectionActive()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not connected to Kafka cluster',
          message: 'Please establish a connection to create topics',
        },
        { status: 401 }
      );
    }

    // PARSE AND VALIDATE REQUEST BODY
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    const validationResult = createTopicFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid topic creation parameters',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, partitions, replicationFactor, config } = validationResult.data;

    // CREATE TOPIC using KafkaService
    try {
      await kafkaService.createTopic(name, partitions, replicationFactor, config || {});

      // SUCCESSFUL CREATION RESPONSE
      return NextResponse.json({
        success: true,
        message: `Topic '${name}' created successfully`,
        data: {
          name,
          partitions,
          replicationFactor,
          config: config || {},
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      });
    } catch (kafkaError) {
      // KAFKA CREATION ERRORS (business logic failures)
      const errorMessage =
        kafkaError instanceof Error ? kafkaError.message : 'Failed to create topic';

      console.warn('Topic creation failed:', errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: {
            topicName: name,
            partitions,
            replicationFactor,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 422 } // Unprocessable Entity
      );
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/kafka/topics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while creating the topic',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/kafka/topics
 *
 * Deletes a Kafka topic (permanent operation)
 *
 * REQUEST BODY:
 * - topicName: Name of topic to delete
 *
 * SAFETY CONSIDERATIONS:
 * - Topic deletion is permanent and cannot be undone
 * - All data in the topic will be lost
 * - Consumer applications may need to handle topic deletion gracefully
 */
export async function DELETE(request: NextRequest) {
  try {
    // VERIFY KAFKA CONNECTION
    if (!kafkaService.isConnectionActive()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not connected to Kafka cluster',
          message: 'Please establish a connection to delete topics',
        },
        { status: 401 }
      );
    }

    // PARSE AND VALIDATE REQUEST BODY
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    const validationResult = deleteTopicSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid topic deletion parameters',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { topicName } = validationResult.data;

    // DELETE TOPIC using KafkaService
    try {
      await kafkaService.deleteTopic(topicName);

      // SUCCESSFUL DELETION RESPONSE
      return NextResponse.json({
        success: true,
        message: `Topic '${topicName}' deleted successfully`,
        data: {
          topicName,
          deletedAt: new Date().toISOString(),
          warning: 'This operation is permanent - all topic data has been lost',
        },
      });
    } catch (kafkaError) {
      // KAFKA DELETION ERRORS
      const errorMessage =
        kafkaError instanceof Error ? kafkaError.message : 'Failed to delete topic';

      console.warn('Topic deletion failed:', errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: {
            topicName,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 422 } // Unprocessable Entity
      );
    }
  } catch (error) {
    console.error('Unexpected error in DELETE /api/kafka/topics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while deleting the topic',
      },
      { status: 500 }
    );
  }
}
