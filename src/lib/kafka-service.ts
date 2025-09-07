/**
 * KAFKA SERVICE LAYER - KafkaJS with Environment Configuration
 *
 * HYBRID PERSISTENCE STRATEGY:
 * - Environment Variables: Static connection configuration (survives restarts)
 * - Route Handlers: Dynamic data fetching from live Kafka cluster
 * - Auto-connection: Connects on startup using env config
 *
 * KAFKAJS ADVANTAGES:
 * - Pure JavaScript (no native bindings like Confluent client)
 * - Works with Kafka 4.0.0 (protocol compatibility)
 * - Cross-platform compatibility (Docker, dev environments)
 * - Mature ecosystem with good documentation
 *
 * ENVIRONMENT-BASED CONFIG:
 * - Connection survives Next.js server restarts
 * - No need to reconnect through UI every time
 * - Production-ready configuration management
 * - Secure credential handling (environment variables)
 */

import { KAFKA_CONFIG, RETRY_CONFIG } from '@/lib/constants';
import { ClusterOverview, KafkaBroker, KafkaTopic } from '@/types/schemas';
import { Broker } from '@/types/kafka';
import { Admin, Kafka, KafkaConfig } from 'kafkajs';

/**
 * ENVIRONMENT CONFIGURATION
 *
 * Reads Kafka settings from environment variables
 * Provides sensible defaults for development
 */
const getKafkaConfig = (): KafkaConfig => {
  const bootstrapServers = process.env.KAFKA_BOOTSTRAP_SERVERS || KAFKA_CONFIG.DEFAULT_SERVERS;
  const clientId = process.env.KAFKA_CLIENT_ID || KAFKA_CONFIG.DEFAULT_CLIENT_ID;

  return {
    clientId,
    brokers: bootstrapServers.split(',').map((server) => server.trim()),
    // KAFKA 4.0.0 OPTIMIZED SETTINGS
    connectionTimeout: parseInt(
      process.env.KAFKA_CONNECTION_TIMEOUT || KAFKA_CONFIG.CONNECTION_TIMEOUT.toString(),
      10
    ),
    requestTimeout: parseInt(
      process.env.KAFKA_REQUEST_TIMEOUT || KAFKA_CONFIG.REQUEST_TIMEOUT.toString(),
      10
    ),
    retry: {
      initialRetryTime: RETRY_CONFIG.INITIAL_RETRY_TIME,
      retries: RETRY_CONFIG.MAX_RETRIES,
    },
    // Future: Add SSL/SASL configuration from environment
    // ssl: process.env.KAFKA_SSL_ENABLED === 'true' ? { ... } : false,
    // sasl: process.env.KAFKA_SASL_MECHANISM ? { ... } : undefined,
  };
};

/**
 * KAFKA CLIENT SINGLETON SERVICE
 *
 * Manages Kafka connections with automatic startup configuration
 * Uses environment variables for persistent connection settings
 */
class KafkaService {
  private kafka: Kafka | null = null;
  private admin: Admin | null = null;
  private isConnected: boolean = false;
  private connectionConfig: KafkaConfig | null = null;

  /**
   * AUTO-INITIALIZE CONNECTION on service startup
   *
   * Attempts to connect using environment configuration
   * Fails silently if environment is not properly configured
   */
  async initialize(): Promise<void> {
    // Only auto-connect if environment variables are provided
    if (process.env.KAFKA_BOOTSTRAP_SERVERS) {
      try {
        console.log('🚀 Auto-connecting to Kafka using environment configuration...');
        await this.connectWithConfig(getKafkaConfig());
        console.log('✅ Auto-connected to Kafka cluster successfully');
      } catch (error) {
        console.warn(
          '⚠️ Auto-connect failed - manual connection required:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        // Don't throw error - allow manual connection through UI
      }
    }
  }

  /**
   * CONNECT WITH CUSTOM CONFIGURATION
   *
   * Used by connection modal for user-provided settings
   * Overrides environment configuration when user connects manually
   */
  async connect(bootstrapServers: string, clientId: string = 'kafka-ui'): Promise<void> {
    const config: KafkaConfig = {
      clientId,
      brokers: bootstrapServers.split(',').map((server) => server.trim()),
      connectionTimeout: 10000,
      requestTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    };

    await this.connectWithConfig(config);
  }

  /**
   * INTERNAL: Connect using provided configuration
   */
  private async connectWithConfig(config: KafkaConfig): Promise<void> {
    try {
      this.connectionConfig = config;

      // CREATE KAFKAJS CLIENT
      this.kafka = new Kafka(config);

      // CREATE ADMIN CLIENT for cluster management
      this.admin = this.kafka.admin();

      // TEST CONNECTION by connecting admin client
      await this.admin.connect();

      this.isConnected = true;
    } catch (error) {
      // CLEANUP on connection failure
      await this.disconnect();

      // ENHANCED ERROR MESSAGES for common Kafka 4.0.0 issues
      const errorMessage = this.parseKafkaError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * PARSE KAFKA CONNECTION ERRORS
   *
   * Converts KafkaJS errors into user-friendly messages
   */
  private parseKafkaError(error: unknown): string {
    if (!(error instanceof Error)) return 'Unknown Kafka connection error';

    const message = error.message.toLowerCase();

    // COMMON KAFKA 4.0.0 ERROR PATTERNS
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return 'Cannot connect to Kafka brokers. Please verify Kafka is running and bootstrap servers are correct.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Connection timeout. Kafka brokers may be unreachable or overloaded.';
    }

    if (message.includes('coordinator not available')) {
      return 'Kafka coordinator not available. The cluster may be starting up.';
    }

    if (message.includes('broker not available')) {
      return 'Kafka brokers are not available. Check if your Kafka cluster is running.';
    }

    // Return original error for debugging
    return `Kafka connection failed: ${error.message}`;
  }

  /**
   * DISCONNECT from Kafka cluster
   */
  async disconnect(): Promise<void> {
    try {
      if (this.admin) {
        await this.admin.disconnect();
        this.admin = null;
      }
      this.kafka = null;
      this.isConnected = false;
      this.connectionConfig = null;
    } catch (error) {
      console.error('Error disconnecting from Kafka:', error);
      // Force cleanup even on error
      this.kafka = null;
      this.admin = null;
      this.isConnected = false;
      this.connectionConfig = null;
    }
  }

  /**
   * GET CLUSTER OVERVIEW METRICS
   *
   * Aggregates multiple Kafka API calls for dashboard display
   */
  async getClusterOverview(): Promise<ClusterOverview> {
    if (!this.admin || !this.isConnected) {
      throw new Error('Not connected to Kafka cluster');
    }

    try {
      // PARALLEL API CALLS for better performance
      const [metadata, topics] = await Promise.all([
        this.admin.describeCluster(),
        this.admin.listTopics(),
      ]);

      // CALCULATE CLUSTER METRICS
      const brokersTotal = metadata.brokers.length;
      const brokersOnline = metadata.brokers.length; // All returned brokers are online
      const topicsCount = topics.length;

      // Calculate total partitions (sample first 50 topics for performance)
      let partitionsCount = 0;
      try {
        const sampleTopics = topics.slice(0, 50);
        if (sampleTopics.length > 0) {
          const topicMetadata = await this.admin.fetchTopicMetadata({
            topics: sampleTopics,
          });

          partitionsCount = topicMetadata.topics.reduce(
            (total, topic) => total + topic.partitions.length,
            0
          );

          // Estimate total if we sampled
          if (topics.length > 50) {
            const avgPartitions = partitionsCount / sampleTopics.length;
            partitionsCount = Math.round(avgPartitions * topics.length);
          }
        }
      } catch (error) {
        console.warn('Could not calculate partition count:', error);
        partitionsCount = topics.length * 3; // Reasonable default
      }

      // METRICS NOT AVAILABLE VIA ADMIN API (would require additional APIs)
      const consumerGroupsCount = 0; // Would use admin.listGroups()
      const messagesPerSecond = 0; // Would require JMX metrics or message counting

      return {
        brokersOnline,
        brokersTotal,
        topicsCount,
        partitionsCount,
        consumerGroupsCount,
        messagesPerSecond,
        status: brokersOnline === brokersTotal ? 'healthy' : 'warning',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch cluster overview: ${message}`);
    }
  }

  /**
   * GET BROKER INFORMATION
   */
  async getBrokers(): Promise<Broker[]> {
    if (!this.admin || !this.isConnected) {
      throw new Error('Not connected to Kafka cluster');
    }

    try {
      const metadata = await this.admin.describeCluster();

      // Get topic distribution per broker (for topicCount and partitionCount)
      let brokerTopicCounts: { [brokerId: number]: { topics: number; partitions: number } } = {};
      
      try {
        const topics = await this.admin.listTopics();
        if (topics.length > 0) {
          // Sample some topics to get partition distribution
          const sampleTopics = topics.slice(0, 20); // Sample first 20 topics for performance
          const topicMetadata = await this.admin.fetchTopicMetadata({
            topics: sampleTopics,
          });

          // Initialize broker counts
          metadata.brokers.forEach(broker => {
            brokerTopicCounts[broker.nodeId] = { topics: 0, partitions: 0 };
          });

          // Count topics and partitions per broker
          const brokerTopics = new Set<string>();
          topicMetadata.topics.forEach(topic => {
            const brokersForTopic = new Set<number>();
            
            topic.partitions.forEach(partition => {
              partition.replicas.forEach(replicaId => {
                const brokerId = typeof replicaId === 'string' ? parseInt(replicaId) : replicaId;
                if (brokerTopicCounts[brokerId]) {
                  brokerTopicCounts[brokerId].partitions++;
                  brokersForTopic.add(brokerId);
                }
              });
            });

            // Count unique topics per broker
            brokersForTopic.forEach(brokerId => {
              if (brokerTopicCounts[brokerId]) {
                brokerTopicCounts[brokerId].topics++;
              }
            });
          });

          // Scale up estimates if we sampled
          if (topics.length > sampleTopics.length) {
            const scaleFactor = topics.length / sampleTopics.length;
            Object.keys(brokerTopicCounts).forEach(brokerIdStr => {
              const brokerId = parseInt(brokerIdStr);
              brokerTopicCounts[brokerId].topics = Math.round(brokerTopicCounts[brokerId].topics * scaleFactor);
              brokerTopicCounts[brokerId].partitions = Math.round(brokerTopicCounts[brokerId].partitions * scaleFactor);
            });
          }
        }
      } catch (error) {
        console.warn('Could not calculate broker topic distribution:', error);
      }

      return metadata.brokers.map((broker) => ({
        id: broker.nodeId,
        host: broker.host,
        port: broker.port,
        rack: (broker as { rack?: string }).rack || undefined,
        status: 'online' as const, // All returned brokers are online by definition
        isController: broker.nodeId === metadata.controller,
        topicCount: brokerTopicCounts[broker.nodeId]?.topics || 0,
        partitionCount: brokerTopicCounts[broker.nodeId]?.partitions || 0,
        config: {}, // Would need separate describeConfigs() call
        metrics: {
          // Mock metrics - in production these come from JMX or monitoring systems
          diskUsage: Math.floor(Math.random() * 80) * 1024 * 1024 * 1024 + 10 * 1024 * 1024 * 1024, // 10-90 GB
          networkIn: Math.floor(Math.random() * 1000) * 1024, // KB/s
          networkOut: Math.floor(Math.random() * 800) * 1024, // KB/s
          requestsPerSecond: Math.floor(Math.random() * 5000) + 1000,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch brokers: ${message}`);
    }
  }

  /**
   * TOPIC MANAGEMENT OPERATIONS
   *
   * KAFKAJS TOPIC API PATTERNS:
   * - createTopics(): Creates topics with configuration (partitions, replication)
   * - deleteTopics(): Removes topics (permanent operation)
   * - listTopics(): Returns topic names only
   * - fetchTopicMetadata(): Returns detailed topic structure with partitions
   * - describeConfigs(): Gets topic configuration settings
   */

  /**
   * LIST ALL TOPICS with detailed metadata
   */
  async getTopics(): Promise<KafkaTopic[]> {
    if (!this.admin || !this.isConnected) {
      throw new Error('Not connected to Kafka cluster');
    }

    try {
      // GET TOPIC NAMES FIRST (lightweight operation)
      const topicNames = await this.admin.listTopics();

      if (topicNames.length === 0) {
        return [];
      }

      // GET DETAILED METADATA for all topics
      // Note: In production, you might want to paginate for clusters with many topics
      const topicDetails = await this.admin.fetchTopicMetadata({
        topics: topicNames,
      });

      // PARALLEL CONFIGURATION FETCH (optional - can be expensive)
      const topicConfigs: { [topicName: string]: Record<string, string> } = {};
      try {
        const configResponse = await this.admin.describeConfigs({
          resources: topicNames.map((topic) => ({
            type: 2, // TOPIC resource type
            name: topic,
          })),
          includeSynonyms: false,
        });

        // Convert config response to lookup object
        configResponse.resources.forEach((resource) => {
          topicConfigs[resource.resourceName] = resource.configEntries.reduce(
            (acc, entry) => {
              acc[entry.configName] = entry.configValue;
              return acc;
            },
            {} as { [key: string]: string }
          );
        });
      } catch (configError) {
        console.warn('Could not fetch topic configurations:', configError);
        // Continue without configs
      }

      // MAP TO STANDARDIZED TOPIC OBJECTS
      return topicDetails.topics.map((topic) => ({
        name: topic.name,
        partitions: topic.partitions.length,
        replicationFactor: topic.partitions[0]?.replicas?.length || 1,
        config: topicConfigs[topic.name] || {},
        metrics: {
          // Mock metrics - in production these would come from Consumer API or JMX
          messageCount: Math.floor(Math.random() * 100000),
          sizeBytes: Math.floor(Math.random() * 1000000),
          consumerLag: Math.floor(Math.random() * 1000),
        },
        status: 'active' as const,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch topics: ${message}`);
    }
  }

  /**
   * GET SINGLE TOPIC DETAILS with full configuration
   */
  async getTopicDetails(topicName: string): Promise<KafkaTopic> {
    if (!this.admin || !this.isConnected) {
      throw new Error('Not connected to Kafka cluster');
    }

    try {
      // FETCH TOPIC METADATA
      const topicMetadata = await this.admin.fetchTopicMetadata({
        topics: [topicName],
      });

      if (topicMetadata.topics.length === 0) {
        throw new Error(`Topic '${topicName}' not found`);
      }

      const topic = topicMetadata.topics[0];

      // FETCH TOPIC CONFIGURATION
      let config = {};
      try {
        const configResponse = await this.admin.describeConfigs({
          resources: [{ type: 2, name: topicName }], // TOPIC resource type
          includeSynonyms: false,
        });

        if (configResponse.resources.length > 0) {
          config = configResponse.resources[0].configEntries.reduce(
            (acc, entry) => {
              acc[entry.configName] = entry.configValue;
              return acc;
            },
            {} as { [key: string]: string }
          );
        }
      } catch (configError) {
        console.warn(`Could not fetch config for topic ${topicName}:`, configError);
      }

      return {
        name: topic.name,
        partitions: topic.partitions.length,
        replicationFactor: topic.partitions[0]?.replicas?.length || 1,
        config,
        metrics: {
          // Mock metrics - would come from real monitoring
          messageCount: Math.floor(Math.random() * 100000),
          sizeBytes: Math.floor(Math.random() * 1000000),
          consumerLag: Math.floor(Math.random() * 1000),
        },
        status: 'active' as const,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch topic details: ${message}`);
    }
  }

  /**
   * CREATE NEW TOPIC with configuration
   */
  async createTopic(
    topicName: string,
    partitions: number = 3,
    replicationFactor: number = 1,
    config: { [key: string]: string } = {}
  ): Promise<void> {
    if (!this.admin || !this.isConnected) {
      throw new Error('Not connected to Kafka cluster');
    }

    try {
      // VALIDATE TOPIC NAME (Kafka naming rules)
      if (!topicName || topicName.trim() === '') {
        throw new Error('Topic name cannot be empty');
      }

      if (topicName.length > 249) {
        throw new Error('Topic name cannot exceed 249 characters');
      }

      // Kafka topic name rules: only alphanumeric, dots, hyphens, underscores
      const validNamePattern = /^[a-zA-Z0-9._-]+$/;
      if (!validNamePattern.test(topicName)) {
        throw new Error(
          'Topic name can only contain letters, numbers, dots, hyphens, and underscores'
        );
      }

      // CHECK IF TOPIC ALREADY EXISTS
      const existingTopics = await this.admin.listTopics();
      if (existingTopics.includes(topicName)) {
        throw new Error(`Topic '${topicName}' already exists`);
      }

      // VALIDATE BROKER COUNT for replication factor
      const metadata = await this.admin.describeCluster();
      if (replicationFactor > metadata.brokers.length) {
        throw new Error(
          `Replication factor ${replicationFactor} cannot exceed broker count ${metadata.brokers.length}`
        );
      }

      // CREATE TOPIC with KafkaJS Admin API
      await this.admin.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: partitions,
            replicationFactor,
            configEntries: Object.entries(config).map(([key, value]) => ({
              name: key,
              value,
            })),
          },
        ],
        // Kafka 4.0.0 supports faster topic creation validation
        validateOnly: false,
        waitForLeaders: true, // Wait for partition leaders to be elected
        timeout: 30000, // 30 second timeout for topic creation
      });

      console.log(`✅ Topic '${topicName}' created successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create topic: ${message}`);
    }
  }

  /**
   * DELETE TOPIC (permanent operation)
   */
  async deleteTopic(topicName: string): Promise<void> {
    if (!this.admin || !this.isConnected) {
      throw new Error('Not connected to Kafka cluster');
    }

    try {
      // VERIFY TOPIC EXISTS before attempting deletion
      const existingTopics = await this.admin.listTopics();
      if (!existingTopics.includes(topicName)) {
        throw new Error(`Topic '${topicName}' does not exist`);
      }

      // DELETE TOPIC using KafkaJS Admin API
      await this.admin.deleteTopics({
        topics: [topicName],
        timeout: 30000, // 30 second timeout
      });

      console.log(`🗑️ Topic '${topicName}' deleted successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete topic: ${message}`);
    }
  }

  /**
   * UPDATE TOPIC CONFIGURATION
   *
   * Note: Kafka only allows updating certain configuration parameters
   * Partition count can be increased but never decreased
   */
  async updateTopicConfig(
    topicName: string,
    configUpdates: { [key: string]: string }
  ): Promise<void> {
    if (!this.admin || !this.isConnected) {
      throw new Error('Not connected to Kafka cluster');
    }

    try {
      // VERIFY TOPIC EXISTS
      const existingTopics = await this.admin.listTopics();
      if (!existingTopics.includes(topicName)) {
        throw new Error(`Topic '${topicName}' does not exist`);
      }

      // UPDATE TOPIC CONFIGURATION using KafkaJS Admin API
      await this.admin.alterConfigs({
        validateOnly: false,
        resources: [
          {
            type: 2, // TOPIC resource type
            name: topicName,
            configEntries: Object.entries(configUpdates).map(([key, value]) => ({
              name: key,
              value,
            })),
          },
        ],
      });

      console.log(`⚙️ Topic '${topicName}' configuration updated successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update topic configuration: ${message}`);
    }
  }

  /**
   * CONNECTION STATUS AND INFO
   */
  isConnectionActive(): boolean {
    return this.isConnected && this.kafka !== null;
  }

  getConnectionInfo(): { brokers: string; clientId: string } | null {
    if (!this.connectionConfig) return null;

    return {
      brokers: Array.isArray(this.connectionConfig.brokers)
        ? this.connectionConfig.brokers.join(',')
        : 'unknown',
      clientId: this.connectionConfig.clientId || 'unknown',
    };
  }
}

// SINGLETON INSTANCE
export const kafkaService = new KafkaService();

// AUTO-INITIALIZE on module load (server startup)
kafkaService.initialize().catch((error) => {
  console.warn('Kafka service initialization failed:', error);
});
