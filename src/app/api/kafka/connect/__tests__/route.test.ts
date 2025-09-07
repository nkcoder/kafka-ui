/**
 * API ROUTE TESTS - KAFKA CONNECT ENDPOINT
 *
 * NEXT.JS API TESTING PATTERNS:
 * - Mock Request/Response objects
 * - Test HTTP methods (GET, POST, DELETE)
 * - Validate request/response formats
 * - Test error handling and validation
 * - Mock external dependencies (KafkaService)
 */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as kafkaService from '@/lib/kafka-service';
import { DELETE, GET, POST } from '../route';

// Mock the kafka service
vi.mock('@/lib/kafka-service', () => ({
  kafkaService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnectionActive: vi.fn(),
    getConnectionInfo: vi.fn(),
  },
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-123'),
});

const mockKafkaService = kafkaService.kafkaService as unknown as {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  isConnectionActive: ReturnType<typeof vi.fn>;
  getConnectionInfo: ReturnType<typeof vi.fn>;
};

describe('/api/kafka/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    test('returns connected status when service is active', async () => {
      mockKafkaService.isConnectionActive.mockReturnValue(true);
      mockKafkaService.getConnectionInfo.mockReturnValue({
        brokers: 'localhost:9092',
        clientId: 'kafka-ui-client',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          connected: true,
          connection: {
            brokers: 'localhost:9092',
            clientId: 'kafka-ui-client',
            status: 'active',
          },
        },
      });
    });

    test('returns disconnected status when service is inactive', async () => {
      mockKafkaService.isConnectionActive.mockReturnValue(false);
      mockKafkaService.getConnectionInfo.mockReturnValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          connected: false,
          message: 'No active Kafka connection',
        },
      });
    });

    test('handles service errors gracefully', async () => {
      mockKafkaService.isConnectionActive.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to check connection status',
      });
    });
  });

  describe('POST', () => {
    test('establishes connection with valid request', async () => {
      const requestBody = {
        name: 'Test Cluster',
        bootstrapServers: 'localhost:9092',
      };

      mockKafkaService.connect.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/kafka/connect', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Successfully connected to Kafka cluster',
        data: {
          id: 'test-uuid-123',
          name: 'Test Cluster',
          bootstrapServers: 'localhost:9092',
          status: 'connected',
          version: '4.0.0',
          controllerId: 'unknown',
        },
      });
    });

    test('validates request body', async () => {
      const invalidBody = {
        // Missing required fields
        name: '',
      };

      const request = new NextRequest('http://localhost:3000/api/kafka/connect', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid connection parameters');
    });

    test('handles malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/kafka/connect', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid JSON in request body',
      });
    });

    test('handles connection failures', async () => {
      const requestBody = {
        name: 'Test Cluster',
        bootstrapServers: 'localhost:9092',
      };

      mockKafkaService.connect.mockRejectedValue(new Error('Cannot connect to Kafka brokers'));

      const request = new NextRequest('http://localhost:3000/api/kafka/connect', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data).toEqual({
        success: false,
        error: 'Cannot connect to Kafka brokers',
        details: {
          bootstrapServers: 'localhost:9092',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('DELETE', () => {
    test('disconnects successfully', async () => {
      mockKafkaService.disconnect.mockResolvedValue(undefined);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Disconnected from Kafka cluster',
      });
    });

    test('handles disconnect errors', async () => {
      mockKafkaService.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to disconnect from Kafka cluster',
      });
    });
  });
});
