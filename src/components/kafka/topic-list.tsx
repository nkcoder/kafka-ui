/**
 * TOPIC LIST COMPONENT WITH DATA TABLE
 *
 * REACT PATTERNS DEMONSTRATED:
 * - Custom hooks for API data fetching with error handling
 * - Component composition with reusable table components
 * - Conditional rendering for loading and empty states
 * - Event handling for user interactions (create, delete)
 *
 * TAILWINDCSS RESPONSIVE DESIGN:
 * - Responsive table layout with horizontal scrolling
 * - Mobile-friendly button and spacing adjustments
 * - Consistent spacing and typography hierarchy
 * - Dark/light theme support through CSS custom properties
 *
 * KAFKA TOPIC DATA STRUCTURE:
 * - Topic names with validation and formatting
 * - Partition and replication factor display
 * - Metrics visualization (message count, size, consumer lag)
 * - Status indicators for topic health
 */

'use client';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type KafkaTopic } from '@/types/schemas';
import { useState } from 'react';

interface TopicListProps {
  topics: KafkaTopic[];
  isLoading: boolean;
  error: string | null;
  onCreateTopic: () => void;
  onDeleteTopic: (topicName: string) => void;
  onRefresh: () => void;
}

/**
 * FORMAT BYTES utility function
 *
 * Converts bytes to human-readable format (KB, MB, GB)
 * Used for displaying topic size metrics
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * FORMAT NUMBER utility function
 *
 * Adds thousand separators for large numbers
 * Used for message count display
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function TopicList({
  topics,
  isLoading,
  error,
  onCreateTopic,
  onDeleteTopic,
  onRefresh,
}: TopicListProps) {
  // LOCAL STATE: Track which topic is being deleted (loading state)
  const [deletingTopic, setDeletingTopic] = useState<string | null>(null);

  // ASYNC DELETE HANDLER with loading state management
  const handleDeleteTopic = async (topicName: string) => {
    try {
      setDeletingTopic(topicName);
      await onDeleteTopic(topicName);
    } finally {
      setDeletingTopic(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* TailwindCSS: space-y-6 adds 24px vertical spacing between sections */}

      {/* HEADER SECTION with actions */}
      <div className="flex items-center justify-between">
        {/* TailwindCSS: flex with justify-between creates space-between layout */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {/* TailwindCSS typography: text-2xl (24px) for section headers */}
            Topics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {/* TailwindCSS: text-sm (14px) with muted color for descriptions */}
            Manage Kafka topics, partitions, and configurations
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          {/* TailwindCSS: gap-3 creates 12px spacing between buttons */}
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            // TailwindCSS: Button component handles disabled states
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>

          <Button
            onClick={onCreateTopic}
            disabled={isLoading}
            // Primary button styling handled by Button component
          >
            Create Topic
          </Button>
        </div>
      </div>

      {/* METRICS SUMMARY BAR */}
      {!isLoading && !error && topics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          {/* TailwindCSS responsive grid:
              - grid-cols-1: Single column on mobile
              - md:grid-cols-4: Four columns on medium screens and up
              - gap-4: 16px spacing between grid items
              - bg-muted/30: Light background with 30% opacity
              - rounded-lg: 8px border radius */}

          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{topics.length}</div>
            <div className="text-sm text-muted-foreground">Total Topics</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {topics.reduce((sum, topic) => sum + topic.partitions, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Partitions</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {topics.length > 0
                ? Math.round(
                    topics.reduce((sum, topic) => sum + topic.replicationFactor, 0) / topics.length
                  )
                : 0}
            </div>
            <div className="text-sm text-muted-foreground">Avg Replication</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {formatBytes(topics.reduce((sum, topic) => sum + (topic.metrics?.sizeBytes || 0), 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Size</div>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          {/* TailwindCSS error styling:
              - border-destructive/50: Red border with 50% opacity
              - bg-destructive/10: Red background with 10% opacity
              - p-4: 16px padding for content spacing */}
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
              <title>Error</title>
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-destructive">Failed to load topics</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-3">
            Try Again
          </Button>
        </div>
      )}

      {/* TOPICS TABLE */}
      <div className="rounded-lg border border-border bg-card">
        {/* TailwindCSS card styling:
            - rounded-lg: 8px border radius for modern appearance
            - border-border: Theme-aware border color
            - bg-card: Card background color from theme */}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic Name</TableHead>
              <TableHead className="text-center">Partitions</TableHead>
              <TableHead className="text-center">Replication</TableHead>
              <TableHead className="text-center">Messages</TableHead>
              <TableHead className="text-center">Size</TableHead>
              <TableHead className="text-center">Consumer Lag</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* LOADING STATE */}
            {isLoading && (
              <TableEmpty colSpan={8}>
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Loading topics...</span>
                </div>
              </TableEmpty>
            )}

            {/* EMPTY STATE */}
            {!isLoading && !error && topics.length === 0 && (
              <TableEmpty colSpan={8}>
                <div className="flex flex-col items-center gap-3">
                  {/* TailwindCSS: flex-col for vertical layout, items-center for centering */}
                  <svg
                    className="h-12 w-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>No topics</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"
                    />
                  </svg>
                  <div className="text-center">
                    <h3 className="font-medium text-foreground">No topics found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first topic to get started with Kafka message streaming
                    </p>
                  </div>
                  <Button onClick={onCreateTopic} className="mt-2">
                    Create Your First Topic
                  </Button>
                </div>
              </TableEmpty>
            )}

            {/* TOPIC ROWS */}
            {!isLoading &&
              !error &&
              topics.map((topic) => (
                <TableRow key={topic.name}>
                  {/* TOPIC NAME COLUMN */}
                  <TableCell>
                    <div className="font-medium text-foreground">{topic.name}</div>
                  </TableCell>

                  {/* PARTITIONS COLUMN */}
                  <TableCell className="text-center">
                    <span className="font-mono text-sm bg-secondary px-2 py-1 rounded">
                      {/* TailwindCSS: font-mono for numbers, bg-secondary for pill styling */}
                      {topic.partitions}
                    </span>
                  </TableCell>

                  {/* REPLICATION FACTOR COLUMN */}
                  <TableCell className="text-center">
                    <span className="font-mono text-sm bg-secondary px-2 py-1 rounded">
                      {topic.replicationFactor}
                    </span>
                  </TableCell>

                  {/* MESSAGE COUNT COLUMN */}
                  <TableCell className="text-center">
                    <span className="font-mono text-sm">
                      {formatNumber(topic.metrics?.messageCount || 0)}
                    </span>
                  </TableCell>

                  {/* SIZE COLUMN */}
                  <TableCell className="text-center">
                    <span className="font-mono text-sm">
                      {formatBytes(topic.metrics?.sizeBytes || 0)}
                    </span>
                  </TableCell>

                  {/* CONSUMER LAG COLUMN */}
                  <TableCell className="text-center">
                    <span
                      className={`font-mono text-sm ${
                        (topic.metrics?.consumerLag || 0) > 1000
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {/* Conditional styling for high consumer lag (performance issue indicator) */}
                      {formatNumber(topic.metrics?.consumerLag || 0)}
                    </span>
                  </TableCell>

                  {/* STATUS COLUMN */}
                  <TableCell className="text-center">
                    <StatusIndicator
                      status={
                        topic.status === 'active'
                          ? 'online'
                          : topic.status === 'deleting'
                            ? 'warning'
                            : 'error'
                      }
                      // StatusIndicator component handles different status colors
                    />
                  </TableCell>

                  {/* ACTIONS COLUMN */}
                  <TableCell className="text-center">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteTopic(topic.name)}
                      disabled={deletingTopic === topic.name}
                      className="text-xs"
                    >
                      {/* TailwindCSS: text-xs (12px) for compact button text */}
                      {deletingTopic === topic.name ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* TABLE FOOTER with additional info */}
      {!isLoading && !error && topics.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          {/* TailwindCSS: flex with justify-between for footer layout */}
          <div>
            Showing {topics.length} topic{topics.length !== 1 ? 's' : ''}
          </div>
          <div>Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
}
