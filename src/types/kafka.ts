// Kafka cluster and connection types
export interface KafkaCluster {
  id: string;
  name: string;
  bootstrapServers: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  version?: string;
  controllerId?: string;
  clusterId?: string;
}

// Cluster configuration for creation/editing
export interface ClusterConfig {
  name: string;
  bootstrapServers: string;
  saslMechanism?: string;
  saslUsername?: string;
  saslPassword?: string;
  securityProtocol?: 'PLAINTEXT' | 'SASL_PLAINTEXT' | 'SASL_SSL' | 'SSL';
  sslCertificate?: string;
}

// Broker types
export interface Broker {
  id: number;
  host: string;
  port: number;
  rack?: string;
  status: 'online' | 'offline' | 'degraded';
  isController: boolean;
  topicCount?: number;
  partitionCount?: number;
  config?: Record<string, unknown>;
  metrics?: {
    diskUsage?: number;
    networkIn?: number;
    networkOut?: number;
    requestsPerSecond?: number;
  };
}

// Legacy alias for backward compatibility
export interface KafkaBroker extends Broker {}

// Topic types
export interface KafkaTopic {
  name: string;
  partitions: number;
  replicationFactor: number;
  config: Record<string, unknown>;
  metrics: {
    messageCount?: number;
    sizeBytes?: number;
    consumerLag?: number;
  };
  status: 'active' | 'deleting' | 'error';
}

export interface TopicPartition {
  partition: number;
  leader: string;
  replicas: string[];
  isr: string[]; // In-sync replicas
  offsetLag?: number;
}

// Consumer types
export interface ConsumerGroup {
  groupId: string;
  state: 'stable' | 'rebalancing' | 'dead';
  members: ConsumerGroupMember[];
  coordinator: string;
  totalLag: number;
}

export interface ConsumerGroupMember {
  memberId: string;
  clientId: string;
  host: string;
  assignments: TopicPartitionAssignment[];
}

export interface TopicPartitionAssignment {
  topic: string;
  partitions: number[];
}

// Producer types (for monitoring)
export interface ProducerMetrics {
  clientId: string;
  producerId: string;
  metrics: {
    recordsPerSecond: number;
    bytesPerSecond: number;
    avgLatency: number;
    errorRate: number;
  };
}

// General status types
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface ClusterOverview {
  brokersOnline: number;
  brokersTotal: number;
  topicsCount: number;
  partitionsCount: number;
  consumerGroupsCount: number;
  messagesPerSecond: number;
  status: HealthStatus;
}
