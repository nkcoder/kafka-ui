'use client';

/**
 * TOPICS PAGE - NEXT.JS APP ROUTER
 *
 * NEXT.JS APP ROUTER PATTERNS:
 * - File-based routing: /topics/page.tsx creates /topics route
 * - Server Components by default, 'use client' for client-side interactivity
 * - Metadata export for SEO and page title
 * - Layout inheritance from parent layout.tsx
 *
 * REACT COMPONENT COMPOSITION:
 * - Page component orchestrates data fetching and UI state
 * - Separates data logic (hooks) from presentation logic (components)
 * - Error boundaries and loading states for robust UX
 * - Modal state management for topic creation workflow
 *
 * TAILWINDCSS PAGE LAYOUT:
 * - Container patterns for responsive design
 * - Consistent spacing and typography hierarchy
 * - Mobile-first responsive considerations
 */

import { CreateTopicModal } from '@/components/kafka/create-topic-modal';
import { TopicList } from '@/components/kafka/topic-list';
import { useClusterConnection } from '@/hooks/use-cluster-connection';
import { useTopicManagement } from '@/hooks/use-topics';
import { CreateTopicForm } from '@/types/schemas';
import { useState } from 'react';

// Server component wrapper for Topics page

/**
 * TOPICS PAGE COMPONENT
 *
 * Main page for Kafka topic management
 * Handles topic listing, creation, and deletion operations
 */
export default function TopicsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { cluster, isConnecting } = useClusterConnection();

  const {
    topics,
    isLoadingTopics,
    topicsError,
    refetchTopics,
    createTopic,
    isCreating,
    createError,
    deleteTopic,
    isDeletingTopic,
    deleteError,
  } = useTopicManagement();

  const handleCreateTopic = async (topicData: CreateTopicForm): Promise<void> => {
    try {
      await createTopic(topicData);
      // Immediately refresh after successful creation so the new topic shows up without manual action
      await refetchTopics();
    } catch (error) {
      console.error('Topic creation error:', error);
    }
  };

  const handleDeleteTopic = async (topicName: string): Promise<void> => {
    const confirmed = window.confirm(
      `Are you sure you want to delete topic "${topicName}"?\n\n` +
        'This action is permanent and cannot be undone.\n' +
        'All messages in this topic will be lost.'
    );

    if (!confirmed) return;

    try {
      await deleteTopic(topicName);
    } catch (error) {
      alert(`Failed to delete topic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!cluster && !isConnecting) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Not connected</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-foreground">Not Connected to Kafka</h2>
            <p className="mt-2 text-sm text-muted-foreground">Connect to a Kafka cluster to view and manage topics.</p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      <div className="bg-success/10 border border-success/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <div>
            <h3 className="font-medium text-foreground">Connected to {cluster?.name || 'Kafka Cluster'}</h3>
            <p className="text-sm text-muted-foreground">{cluster?.bootstrapServers}</p>
          </div>
        </div>
      </div>

      {(createError || deleteError) && (
        <div className="mb-6 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <title>Error</title>
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-medium text-destructive">Operation Failed</h3>
              <p className="mt-1 text-sm text-muted-foreground">{createError || deleteError}</p>
            </div>
          </div>
        </div>
      )}

      <TopicList
        topics={topics}
        isLoading={isLoadingTopics || isConnecting}
        error={topicsError}
        onCreateTopic={() => setIsCreateModalOpen(true)}
        onDeleteTopic={handleDeleteTopic}
        onRefresh={refetchTopics}
      />

      <CreateTopicModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateTopic} />

      {(isCreating || isDeletingTopic) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-foreground">{isCreating ? 'Creating topic...' : `Deleting topic ${isDeletingTopic}...`}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
