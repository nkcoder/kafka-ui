import { z } from 'zod';

/**
 * KAFKA TYPE DEFINITIONS WITH ZOD VALIDATION
 *
 * Why Zod?
 * - Runtime validation: TypeScript only validates at compile time, but API responses
 *   need validation at runtime to ensure data integrity
 * - Type inference: Zod schemas automatically generate TypeScript types
 * - Error handling: Provides clear validation errors when API data is malformed
 *
 * This is especially important for Kafka APIs since:
 * 1. Kafka broker responses can vary by version
 * 2. Network issues can corrupt data
 * 3. We need to handle both successful and error responses safely
 */

// Connection and cluster schemas
export const kafkaClusterSchema = z.object({
  id: z.string(),
  name: z.string(),
  bootstrapServers: z.string(),
  status: z.enum(['connected', 'disconnected', 'connecting', 'error']),
  version: z.string().optional(),
  controllerId: z.string().optional(),
  clusterId: z.string().optional(),
});

// Broker schemas
export const brokerMetricsSchema = z.object({
  diskUsage: z.number().optional(),
  networkIn: z.number().optional(),
  networkOut: z.number().optional(),
  requestsPerSecond: z.number().optional(),
});

export const kafkaBrokerSchema = z.object({
  id: z.string(),
  host: z.string(),
  port: z.number(),
  rack: z.string().optional(),
  status: z.enum(['online', 'offline']),
  isController: z.boolean(),
  config: z.record(z.string(), z.any()),
  metrics: brokerMetricsSchema,
});

// Topic schemas
export const topicMetricsSchema = z.object({
  messageCount: z.number().optional(),
  sizeBytes: z.number().optional(),
  consumerLag: z.number().optional(),
});

export const kafkaTopicSchema = z.object({
  name: z.string(),
  partitions: z.number(),
  replicationFactor: z.number(),
  config: z.record(z.string(), z.any()),
  metrics: topicMetricsSchema,
  status: z.enum(['active', 'deleting', 'error']),
});

export const topicPartitionSchema = z.object({
  partition: z.number(),
  leader: z.string(),
  replicas: z.array(z.string()),
  isr: z.array(z.string()),
  offsetLag: z.number().optional(),
});

// Consumer schemas
export const topicPartitionAssignmentSchema = z.object({
  topic: z.string(),
  partitions: z.array(z.number()),
});

export const consumerGroupMemberSchema = z.object({
  memberId: z.string(),
  clientId: z.string(),
  host: z.string(),
  assignments: z.array(topicPartitionAssignmentSchema),
});

export const consumerGroupSchema = z.object({
  groupId: z.string(),
  state: z.enum(['stable', 'rebalancing', 'dead']),
  members: z.array(consumerGroupMemberSchema),
  coordinator: z.string(),
  totalLag: z.number(),
});

// Producer schemas
export const producerMetricsSchema = z.object({
  recordsPerSecond: z.number(),
  bytesPerSecond: z.number(),
  avgLatency: z.number(),
  errorRate: z.number(),
});

export const producerMetricsApiSchema = z.object({
  clientId: z.string(),
  producerId: z.string(),
  metrics: producerMetricsSchema,
});

// Overview schemas
export const clusterOverviewSchema = z.object({
  brokersOnline: z.number(),
  brokersTotal: z.number(),
  topicsCount: z.number(),
  partitionsCount: z.number(),
  consumerGroupsCount: z.number(),
  messagesPerSecond: z.number(),
  status: z.enum(['healthy', 'warning', 'critical', 'unknown']),
});

// Connection form validation
export const connectionFormSchema = z.object({
  name: z.string().min(1, 'Cluster name is required'),
  bootstrapServers: z
    .string()
    .min(1, 'Bootstrap servers are required')
    .regex(/^[^:]+:\d+(,[^:]+:\d+)*$/, 'Format: host:port or host1:port1,host2:port2'),
});

// Topic creation and management schemas
export const createTopicFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Topic name is required')
    .max(249, 'Topic name cannot exceed 249 characters')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Topic name can only contain letters, numbers, dots, hyphens, and underscores'
    ),
  partitions: z
    .number()
    .int()
    .min(1, 'Must have at least 1 partition')
    .max(1000, 'Maximum 1000 partitions allowed'),
  replicationFactor: z
    .number()
    .int()
    .min(1, 'Must have at least 1 replica')
    .max(10, 'Maximum 10 replicas allowed'),
  config: z.record(z.string(), z.string()).optional(),
});

export const deleteTopicSchema = z.object({
  topicName: z.string().min(1, 'Topic name is required'),
});

export const updateTopicConfigSchema = z.object({
  topicName: z.string().min(1, 'Topic name is required'),
  config: z.record(z.string(), z.string()),
});

// Export inferred types
export type KafkaCluster = z.infer<typeof kafkaClusterSchema>;
export type KafkaBroker = z.infer<typeof kafkaBrokerSchema>;
export type KafkaTopic = z.infer<typeof kafkaTopicSchema>;
export type TopicPartition = z.infer<typeof topicPartitionSchema>;
export type ConsumerGroup = z.infer<typeof consumerGroupSchema>;
export type ConsumerGroupMember = z.infer<typeof consumerGroupMemberSchema>;
export type ProducerMetrics = z.infer<typeof producerMetricsApiSchema>;
export type ClusterOverview = z.infer<typeof clusterOverviewSchema>;
export type ConnectionForm = z.infer<typeof connectionFormSchema>;
export type CreateTopicForm = z.infer<typeof createTopicFormSchema>;
export type DeleteTopicRequest = z.infer<typeof deleteTopicSchema>;
export type UpdateTopicConfigRequest = z.infer<typeof updateTopicConfigSchema>;
