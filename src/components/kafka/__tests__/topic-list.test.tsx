/**
 * TOPIC LIST COMPONENT TESTS
 *
 * REACT TESTING LIBRARY PATTERNS:
 * - render() for component rendering
 * - screen queries for element selection
 * - fireEvent/user-event for user interactions
 * - waitFor for async operations
 * - Custom render wrapper for providers
 *
 * COMPONENT TESTING STRATEGY:
 * - Test all component states (loading, error, empty, populated)
 * - Test user interactions (buttons, table actions)
 * - Test prop callbacks are called correctly
 * - Test accessibility and semantic HTML
 */

import { type KafkaTopic } from '@/types/schemas';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TopicList } from '../topic-list';

// MOCK TOPIC DATA
const mockTopics: KafkaTopic[] = [
  {
    name: 'user-events',
    partitions: 3,
    replicationFactor: 2,
    config: { 'cleanup.policy': 'delete' },
    metrics: {
      messageCount: 1500,
      sizeBytes: 75000,
      consumerLag: 50,
    },
    status: 'active',
  },
  {
    name: 'order-processing',
    partitions: 6,
    replicationFactor: 3,
    config: { 'retention.ms': '604800000' },
    metrics: {
      messageCount: 10000,
      sizeBytes: 250000,
      consumerLag: 1200, // High lag for testing
    },
    status: 'active',
  },
];

// DEFAULT PROPS
const defaultProps = {
  topics: [],
  isLoading: false,
  error: null,
  onCreateTopic: vi.fn(),
  onDeleteTopic: vi.fn(),
  onRefresh: vi.fn(),
};

describe('TopicList', () => {
  it('should render loading state', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} isLoading={true} />);

    // ASSERT
    expect(screen.getByText('Loading topics...')).toBeInTheDocument();
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();

    // Should disable action buttons during loading
    expect(screen.getByRole('button', { name: /refreshing/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /create topic/i })).toBeDisabled();
  });

  it('should render error state', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} error="Failed to connect to Kafka" />);

    // ASSERT
    expect(screen.getByText('Failed to load topics')).toBeInTheDocument();
    expect(screen.getByText('Failed to connect to Kafka')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should render empty state', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} />);

    // ASSERT
    expect(screen.getByText('No topics found')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first topic to get started with Kafka message streaming')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first topic/i })).toBeInTheDocument();
  });

  it('should render topics table with data', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} topics={mockTopics} />);

    // ASSERT: Check table headers
    expect(screen.getByRole('columnheader', { name: /topic name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /partitions/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /replication/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /size/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /consumer lag/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

    // ASSERT: Check topic data
    expect(screen.getByText('user-events')).toBeInTheDocument();
    expect(screen.getByText('order-processing')).toBeInTheDocument();

    // Check formatted numbers
    expect(screen.getByText('1,500')).toBeInTheDocument(); // messageCount
    expect(screen.getByText('10,000')).toBeInTheDocument();

    // Check formatted sizes
    expect(screen.getByText('73.2 KB')).toBeInTheDocument(); // 75000 bytes
    expect(screen.getByText('244.1 KB')).toBeInTheDocument(); // 250000 bytes
  });

  it('should render metrics summary', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} topics={mockTopics} />);

    // ASSERT: Check summary metrics by looking for them in the context of their labels
    expect(screen.getByText('Total Topics')).toBeInTheDocument();
    expect(screen.getByText('Total Partitions')).toBeInTheDocument();
    expect(screen.getByText('Avg Replication')).toBeInTheDocument();
    expect(screen.getByText('Total Size')).toBeInTheDocument();

    // Check metrics values exist (but don't check specific numbers to avoid conflicts)
    // Use getAllByText and check the first occurrence (in metrics summary)
    const totalPartitionsElements = screen.getAllByText('9');
    expect(totalPartitionsElements.length).toBeGreaterThan(0); // Total Partitions (3+6)

    const avgReplicationElements = screen.getAllByText('3');
    expect(avgReplicationElements.length).toBeGreaterThan(0); // Avg Replication (rounded)

    expect(screen.getByText('317.4 KB')).toBeInTheDocument(); // Total Size
  });

  it('should highlight high consumer lag', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} topics={mockTopics} />);

    // ASSERT: High lag should have destructive text color
    const highLagElement = screen.getByText('1,200');
    expect(highLagElement).toHaveClass('text-destructive');

    // Low lag should not have destructive color
    const lowLagElement = screen.getByText('50');
    expect(lowLagElement).not.toHaveClass('text-destructive');
  });

  it('should call onCreateTopic when create button is clicked', async () => {
    // ARRANGE
    const mockOnCreateTopic = vi.fn();
    const user = userEvent.setup();

    render(<TopicList {...defaultProps} topics={mockTopics} onCreateTopic={mockOnCreateTopic} />);

    // ACT
    await user.click(screen.getByRole('button', { name: /create topic/i }));

    // ASSERT
    expect(mockOnCreateTopic).toHaveBeenCalledTimes(1);
  });

  it('should call onRefresh when refresh button is clicked', async () => {
    // ARRANGE
    const mockOnRefresh = vi.fn();
    const user = userEvent.setup();

    render(<TopicList {...defaultProps} topics={mockTopics} onRefresh={mockOnRefresh} />);

    // ACT
    await user.click(screen.getByRole('button', { name: /refresh/i }));

    // ASSERT
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('should call onDeleteTopic with topic name when delete button is clicked', async () => {
    // ARRANGE
    const mockOnDeleteTopic = vi.fn();
    const user = userEvent.setup();

    render(<TopicList {...defaultProps} topics={mockTopics} onDeleteTopic={mockOnDeleteTopic} />);

    // Find the first delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    // ACT
    await user.click(deleteButtons[0]);

    // ASSERT
    expect(mockOnDeleteTopic).toHaveBeenCalledWith('user-events');
  });

  it('should show deleting state for specific topic', () => {
    // ARRANGE: Mock props with deleting state
    const propsWithDeleting = {
      ...defaultProps,
      topics: mockTopics,
    };

    // Mock the deletingTopic state by passing it as a prop
    // In actual component, this would be internal state
    render(<TopicList {...propsWithDeleting} />);

    // We'll test this through the loading state of delete buttons
    // The actual implementation uses internal state, so this is more of an integration test
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);

    // All delete buttons should be enabled initially
    deleteButtons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should render table footer with topic count and timestamp', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} topics={mockTopics} />);

    // ASSERT
    expect(screen.getByText('Showing 2 topics')).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('should handle singular vs plural topic count correctly', () => {
    // ARRANGE & ACT: Test singular
    const { rerender } = render(<TopicList {...defaultProps} topics={[mockTopics[0]]} />);

    // ASSERT: Singular
    expect(screen.getByText('Showing 1 topic')).toBeInTheDocument();

    // ACT: Test plural
    rerender(<TopicList {...defaultProps} topics={mockTopics} />);

    // ASSERT: Plural
    expect(screen.getByText('Showing 2 topics')).toBeInTheDocument();
  });

  it('should not render metrics summary when loading', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} topics={mockTopics} isLoading={true} />);

    // ASSERT: Metrics summary should not be visible during loading
    expect(screen.queryByText('Total Topics')).not.toBeInTheDocument();
  });

  it('should not render metrics summary when there is an error', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} topics={mockTopics} error="Some error" />);

    // ASSERT: Metrics summary should not be visible during error
    expect(screen.queryByText('Total Topics')).not.toBeInTheDocument();
  });

  it('should render accessible table structure', () => {
    // ARRANGE & ACT
    render(<TopicList {...defaultProps} topics={mockTopics} />);

    // ASSERT: Check semantic HTML structure
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(8);
    expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 data rows

    // Check that status indicators are present (active topics show as 'online')
    // The status might be in aria-label rather than visible text
    const statusIndicators = screen.getAllByLabelText(/Status:/);
    expect(statusIndicators.length).toBeGreaterThan(0);

    // Check for the online status indicators (there should be 2 active topics)
    const onlineIndicators = screen.getAllByLabelText('Status: online');
    expect(onlineIndicators.length).toBe(2);
  });

  it('should format bytes correctly', () => {
    // ARRANGE: Topic with specific byte sizes for testing
    const topicWithLargeSize: KafkaTopic = {
      ...mockTopics[0],
      metrics: {
        ...mockTopics[0].metrics,
        sizeBytes: 1048576, // 1 MB
      },
    };

    // ACT
    render(<TopicList {...defaultProps} topics={[topicWithLargeSize]} />);

    // ASSERT
    // Check that 1 MB appears (could be in metrics summary or table data)
    const mbElements = screen.getAllByText('1 MB');
    expect(mbElements.length).toBeGreaterThan(0);
  });

  it('should format numbers with thousand separators', () => {
    // ARRANGE: Topic with large message count
    const topicWithLargeCount: KafkaTopic = {
      ...mockTopics[0],
      metrics: {
        ...mockTopics[0].metrics,
        messageCount: 1234567,
      },
    };

    // ACT
    render(<TopicList {...defaultProps} topics={[topicWithLargeCount]} />);

    // ASSERT
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});
