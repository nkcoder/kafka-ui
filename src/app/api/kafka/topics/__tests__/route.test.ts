/**
 * TOPICS API ROUTE TESTS
 *
 * TESTING STRATEGY:
 * - Test all HTTP methods (GET, POST, DELETE)
 * - Mock kafkaService to isolate route handler logic
 * - Test error scenarios and edge cases
 * - Validate request/response formats
 * - Test authentication (connection requirement)
 *
 * VITEST PATTERNS:
 * - describe/it structure for organized test cases
 * - beforeEach for test isolation and setup
 * - Mock functions to control dependencies
 * - Snapshot testing for response formats
 */

import { kafkaService } from '@/lib/kafka-service';
import type { CreateTopicForm, DeleteTopicRequest } from '@/types/schemas';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST } from '../route';

// MOCK KAFKA SERVICE
vi.mock('@/lib/kafka-service', () => ({
  kafkaService: {
    isConnectionActive: vi.fn(),
    getTopics: vi.fn(),
    createTopic: vi.fn(),
    deleteTopic: vi.fn(),
  },
}));

const mockKafkaService = kafkaService as unknown as {
  isConnectionActive: ReturnType<typeof vi.fn>;
  getTopics: ReturnType<typeof vi.fn>;
  createTopic: ReturnType<typeof vi.fn>;
  deleteTopic: ReturnType<typeof vi.fn>;
};

describe('/api/kafka/topics', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('GET /api/kafka/topics', () => {
    it('should return topics when connected', async () => {
      // ARRANGE: Mock connected state and topic data
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      const mockTopics = [
        {
          name: 'test-topic',
          partitions: 3,
          replicationFactor: 1,
          config: { 'cleanup.policy': 'delete' },
          metrics: { messageCount: 1000, sizeBytes: 50000, consumerLag: 10 },
          status: 'active',
        },
        {
          name: 'user-events',
          partitions: 6,
          replicationFactor: 2,
          config: { 'retention.ms': '604800000' },
          metrics: { messageCount: 5000, sizeBytes: 250000, consumerLag: 0 },
          status: 'active',
        },
      ];
      mockKafkaService.getTopics.mockResolvedValue(mockTopics);

      // ACT: Call the route handler
      const response = await GET();
      const data = await response.json();

      // ASSERT: Verify response structure and data
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: mockTopics,
        count: 2,
        metadata: {
          totalTopics: 2,
          avgPartitions: 5, // (3 + 6) / 2 rounded
          avgReplicationFactor: 2, // (1 + 2) / 2 rounded
        },
      });
      expect(data).toHaveProperty('timestamp');
    });

    it('should return 401 when not connected', async () => {
      // ARRANGE: Mock disconnected state
      mockKafkaService.isConnectionActive.mockReturnValue(false);

      // ACT
      const response = await GET();
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(401);
      expect(data).toMatchObject({
        success: false,
        error: 'Not connected to Kafka cluster',
        message: 'Please establish a connection to view topics',
      });

      // Verify kafkaService.getTopics was not called
      expect(mockKafkaService.getTopics).not.toHaveBeenCalled();
    });

    it('should return 503 when Kafka service fails', async () => {
      // ARRANGE: Mock connected state but service failure
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      mockKafkaService.getTopics.mockRejectedValue(new Error('Kafka broker unavailable'));

      // ACT
      const response = await GET();
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(503);
      expect(data).toMatchObject({
        success: false,
        error: 'Kafka broker unavailable',
        data: [],
        count: 0,
      });
    });

    it('should return empty topics list gracefully', async () => {
      // ARRANGE: Mock connected state with no topics
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      mockKafkaService.getTopics.mockResolvedValue([]);

      // ACT
      const response = await GET();
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: [],
        count: 0,
        metadata: {
          totalTopics: 0,
          avgPartitions: 0,
          avgReplicationFactor: 0,
        },
      });
    });
  });

  describe('POST /api/kafka/topics', () => {
    const createValidRequest = (body: CreateTopicForm) => {
      return {
        json: vi.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    it('should create topic successfully', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      mockKafkaService.createTopic.mockResolvedValue(undefined);

      const requestBody = {
        name: 'new-topic',
        partitions: 3,
        replicationFactor: 1,
        config: { 'cleanup.policy': 'delete' },
      };
      const request = createValidRequest(requestBody);

      // ACT
      const response = await POST(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        message: "Topic 'new-topic' created successfully",
        data: {
          name: 'new-topic',
          partitions: 3,
          replicationFactor: 1,
          config: { 'cleanup.policy': 'delete' },
          status: 'active',
        },
      });
      expect(data.data).toHaveProperty('createdAt');

      // Verify kafkaService was called correctly
      expect(mockKafkaService.createTopic).toHaveBeenCalledWith('new-topic', 3, 1, {
        'cleanup.policy': 'delete',
      });
    });

    it('should return 401 when not connected', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(false);
      const request = createValidRequest({ name: 'test', partitions: 1, replicationFactor: 1 });

      // ACT
      const response = await POST(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(401);
      expect(data).toMatchObject({
        success: false,
        error: 'Not connected to Kafka cluster',
      });
    });

    it('should return 400 for invalid JSON', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      // ACT
      const response = await POST(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: 'Invalid JSON in request body',
      });
    });

    it('should return 400 for invalid topic name', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      const request = createValidRequest({
        name: 'invalid topic name!', // Contains spaces and special chars
        partitions: 3,
        replicationFactor: 1,
      });

      // ACT
      const response = await POST(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: 'Invalid topic creation parameters',
      });
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringContaining('only contain letters, numbers'),
          }),
        ])
      );
    });

    it('should return 422 when topic creation fails', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      mockKafkaService.createTopic.mockRejectedValue(new Error("Topic 'test' already exists"));

      const request = createValidRequest({
        name: 'test',
        partitions: 3,
        replicationFactor: 1,
      });

      // ACT
      const response = await POST(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(422);
      expect(data).toMatchObject({
        success: false,
        error: "Topic 'test' already exists",
        details: {
          topicName: 'test',
          partitions: 3,
          replicationFactor: 1,
        },
      });
    });

    it('should validate partition count limits', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      const request = createValidRequest({
        name: 'test-topic',
        partitions: 0, // Invalid: too low
        replicationFactor: 1,
      });

      // ACT
      const response = await POST(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(400);
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'partitions',
            message: 'Must have at least 1 partition',
          }),
        ])
      );
    });
  });

  describe('DELETE /api/kafka/topics', () => {
    const createValidRequest = (body: DeleteTopicRequest) => {
      return {
        json: vi.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    it('should delete topic successfully', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      mockKafkaService.deleteTopic.mockResolvedValue(undefined);

      const request = createValidRequest({ topicName: 'test-topic' });

      // ACT
      const response = await DELETE(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        message: "Topic 'test-topic' deleted successfully",
        data: {
          topicName: 'test-topic',
          warning: 'This operation is permanent - all topic data has been lost',
        },
      });
      expect(data.data).toHaveProperty('deletedAt');

      // Verify kafkaService was called correctly
      expect(mockKafkaService.deleteTopic).toHaveBeenCalledWith('test-topic');
    });

    it('should return 401 when not connected', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(false);
      const request = createValidRequest({ topicName: 'test-topic' });

      // ACT
      const response = await DELETE(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(401);
      expect(data).toMatchObject({
        success: false,
        error: 'Not connected to Kafka cluster',
      });
    });

    it('should return 400 for missing topic name', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      const request = createValidRequest({ topicName: '' }); // Empty topic name

      // ACT
      const response = await DELETE(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: 'Invalid topic deletion parameters',
      });
    });

    it('should return 422 when topic deletion fails', async () => {
      // ARRANGE
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      mockKafkaService.deleteTopic.mockRejectedValue(
        new Error("Topic 'nonexistent' does not exist")
      );

      const request = createValidRequest({ topicName: 'nonexistent' });

      // ACT
      const response = await DELETE(request);
      const data = await response.json();

      // ASSERT
      expect(response.status).toBe(422);
      expect(data).toMatchObject({
        success: false,
        error: "Topic 'nonexistent' does not exist",
        details: {
          topicName: 'nonexistent',
        },
      });
    });
  });
});
