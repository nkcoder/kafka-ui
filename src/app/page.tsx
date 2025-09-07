/**
 * DASHBOARD HOME PAGE - Next.js App Router
 *
 * NEXT.JS FILE-BASED ROUTING:
 * - src/app/page.tsx → Creates route at "/"
 * - Server Component: Runs on server, can fetch data during build/request
 * - "@/" import alias: Configured in tsconfig.json for cleaner imports
 *
 * REACT COMPONENT STRUCTURE:
 * - Default export function: Next.js page component pattern
 * - Props destructuring: Clean parameter handling
 * - Layout composition: Wraps content in reusable DashboardLayout
 *
 * TAILWINDCSS RESPONSIVE GRID SYSTEM:
 * - space-y-6: Adds consistent vertical spacing (24px) between sections
 * - grid gap-6: CSS Grid with gap property for even spacing
 * - md:grid-cols-2 lg:grid-cols-3: Responsive breakpoints
 *   - Mobile: 1 column (default)
 *   - Tablet (768px+): 2 columns
 *   - Desktop (1024px+): 3 columns
 * - Auto-fit grid: Cards flow naturally to new rows
 *
 * FRONTEND STATE MANAGEMENT PREVIEW:
 * - Mock data simulates API responses
 * - isConnected state drives conditional UI rendering
 * - Future: React Context/Zustand for global state
 */

/**
 * DASHBOARD HOME PAGE - Next.js App Router
 *
 * NEXT.JS FILE-BASED ROUTING:
 * - src/app/page.tsx → Creates route at "/"
 * - Server Component: Runs on server, can fetch data during build/request
 * - "@/" import alias: Configured in tsconfig.json for cleaner imports
 *
 * REACT COMPONENT STRUCTURE:
 * - Default export function: Next.js page component pattern
 * - Props destructuring: Clean parameter handling
 * - Layout composition: Wraps content in reusable DashboardLayout
 *
 * REACT HOOKS INTEGRATION:
 * - useState for local modal state management
 * - Custom hook (useClusterConnection) for shared cluster state
 * - Conditional rendering based on connection status
 */

'use client'; // Required for useState hook

import { ConnectionModal } from '@/components/kafka/connection-modal';
import { DefaultLayout } from '@/components/layout/default-layout';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useClusterConnection } from '@/hooks/use-cluster-connection';
import { useClusterOverview } from '@/hooks/use-cluster-overview';
import { useState } from 'react';

export default function Home() {
  // LOCAL STATE: Modal visibility controlled by this component
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // GLOBAL STATE: Cluster connection status from React Context
  const { cluster, isConnecting, disconnect } = useClusterConnection();

  // REAL-TIME DATA: Cluster overview metrics from Kafka APIs
  const { overview, isLoading: metricsLoading, error: metricsError, refresh: refreshMetrics } = useClusterOverview(30); // Auto-refresh every 30 seconds

  // DERIVED STATE: Compute connection status from cluster object
  const isConnected = cluster?.status === 'connected';

  // REAL DATA: Use actual Kafka metrics when connected, fallback to zeros
  const displayOverview = overview || {
    brokersOnline: 0,
    brokersTotal: 0,
    topicsCount: 0,
    partitionsCount: 0,
    consumerGroupsCount: 0,
    messagesPerSecond: 0,
    status: 'unknown' as const,
  };

  // EVENT HANDLERS: Functions to manage modal state
  const openConnectionModal = () => setShowConnectionModal(true);
  const closeConnectionModal = () => setShowConnectionModal(false);

  return (
    <DefaultLayout header={<Header title="Cluster Dashboard" description="Manage and monitor your Kafka infrastructure" />}>
      <div className="space-y-6">
        {/* TailwindCSS: space-y-6 adds consistent 24px vertical spacing */}

        {/* ERROR HANDLING: Show metrics error if present */}
        {metricsError && isConnected && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIndicator status="error" size="lg" />
                <div>
                  <h3 className="font-medium text-foreground">Failed to Load Cluster Metrics</h3>
                  <p className="text-sm text-muted-foreground">{metricsError}</p>
                </div>
              </div>

              <Button variant="outline" onClick={refreshMetrics} size="sm">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* CONDITIONAL RENDERING: Connection status banner */}
        {!isConnected && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            {/* TailwindCSS warning styling with opacity modifiers:
                - bg-warning/10: Warning color with 10% opacity
                - border-warning/20: Warning color with 20% opacity border */}
            <div className="flex items-center justify-between">
              {/* Flexbox layout: content left, button right */}
              <div className="flex items-center gap-3">
                <StatusIndicator status={isConnecting ? 'connecting' : 'warning'} size="lg" />
                {/* Dynamic status based on connection state */}
                <div>
                  <h3 className="font-medium text-foreground">
                    {isConnected ? `Connected to ${cluster?.name}` : isConnecting ? 'Connecting to Kafka...' : 'No Cluster Connected'}
                    {/* Conditional text based on connection state */}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isConnecting
                      ? 'Testing connection to bootstrap servers...'
                      : 'Connect to a Kafka cluster to start managing your infrastructure'}
                  </p>
                </div>
              </div>

              {/* INTERACTIVE BUTTON: Opens connection modal */}
              <Button
                variant="primary"
                onClick={openConnectionModal} // Event handler for modal
                disabled={isConnecting} // Disable during connection attempt
                loading={isConnecting} // Show loading state
              >
                {isConnecting ? 'Connecting...' : 'Connect Cluster'}
              </Button>
            </div>
          </div>
        )}

        {/* CONNECTED STATE: Show cluster info */}
        {isConnected && cluster && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            {/* TailwindCSS success styling with green color scheme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIndicator status="online" size="lg" />
                <div>
                  <h3 className="font-medium text-foreground">Connected to {cluster.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cluster.bootstrapServers} • Kafka v{cluster.version}
                  </p>
                </div>
              </div>

              {/* DISCONNECT FUNCTIONALITY */}
              <Button
                variant="outline"
                onClick={disconnect} // Disconnect function from context
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* REAL-TIME METRICS OVERVIEW */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* TailwindCSS responsive grid with real Kafka data */}

          <MetricCard
            title="Brokers Online"
            value={`${displayOverview.brokersOnline}/${displayOverview.brokersTotal}`}
            icon="⚡"
            status={
              displayOverview.brokersOnline === 0
                ? 'critical'
                : displayOverview.brokersOnline === displayOverview.brokersTotal
                ? 'healthy'
                : 'warning'
            }
            loading={metricsLoading && isConnected} // Show loading only when connected
          />

          <MetricCard
            title="Total Topics"
            value={displayOverview.topicsCount}
            icon="📝"
            status="healthy"
            loading={metricsLoading && isConnected}
            // Future: Add trend data from historical metrics
          />

          <MetricCard
            title="Total Partitions"
            value={displayOverview.partitionsCount}
            icon="📊"
            status="healthy"
            loading={metricsLoading && isConnected}
          />

          <MetricCard
            title="Consumer Groups"
            value={displayOverview.consumerGroupsCount}
            icon="👥"
            status="healthy"
            loading={metricsLoading && isConnected}
            // Note: Consumer groups require separate API implementation
          />

          <MetricCard
            title="Messages/sec"
            value={displayOverview.messagesPerSecond}
            icon="🚀"
            trend={
              displayOverview.messagesPerSecond > 0
                ? {
                    direction: 'up' as const,
                    value: 'Real-time',
                  }
                : undefined
            }
            status="healthy"
            loading={metricsLoading && isConnected}
            // Note: Real message rate requires JMX metrics or message counting
          />

          <MetricCard
            title="Cluster Health"
            value={
              isConnected
                ? displayOverview.status === 'healthy'
                  ? 'Healthy'
                  : displayOverview.status === 'warning'
                  ? 'Warning'
                  : 'Connected'
                : 'Disconnected'
            }
            icon="💚"
            status={
              isConnected
                ? displayOverview.status === 'healthy'
                  ? 'healthy'
                  : displayOverview.status === 'warning'
                  ? 'warning'
                  : 'healthy'
                : 'critical'
            }
            loading={isConnecting} // Show loading during connection attempt
          />
        </div>

        {/* QUICK ACTIONS GRID */}
        <div className="bg-card border border-border rounded-lg p-6">
          {/* TailwindCSS card styling: consistent with other dashboard cards */}
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* TailwindCSS responsive grid:
                - Default: 1 column on mobile
                - md:grid-cols-2: 2 columns on tablet (768px+)
                - lg:grid-cols-3: 3 columns on desktop (1024px+)
                - gap-4: 16px spacing between grid items */}

            {/* CONNECTION ACTION BUTTON */}
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={openConnectionModal}
              disabled={isConnecting}
              // TailwindCSS button customization:
              // - h-auto: Allow button height to adjust to content
              // - p-4: 16px padding on all sides
              // - flex-col: Stack icon and text vertically
              // - gap-2: 8px spacing between stacked elements
            >
              <span className="text-2xl">🔗</span>
              <span>{isConnected ? 'Change Cluster' : 'Connect Cluster'}</span>
              <span className="text-xs text-muted-foreground">Configure bootstrap servers</span>
            </Button>

            {/* TOPIC CREATION ACTION */}
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              disabled={!isConnected} // Enable only when connected
              // Future: onClick handler for topic creation modal
            >
              <span className="text-2xl">📝</span>
              <span>Create Topic</span>
              <span className="text-xs text-muted-foreground">Add new topic to cluster</span>
            </Button>

            {/* CONSUMER MONITORING ACTION */}
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              disabled={!isConnected} // Enable only when connected
              // Future: onClick handler for consumer monitoring page
            >
              <span className="text-2xl">👥</span>
              <span>Monitor Consumers</span>
              <span className="text-xs text-muted-foreground">View consumer group lag</span>
            </Button>
          </div>
        </div>

        {/* RECENT ACTIVITY SECTION */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-muted-foreground">
            {/* Empty state with centered content */}
            <span className="text-4xl mb-2 block">📋</span>
            <p>{isConnected ? 'No recent activity' : 'No activity to show'}</p>
            <p className="text-sm mt-1">
              {isConnected
                ? 'Activity will appear here as you manage your cluster'
                : 'Activity will appear here once connected to a cluster'}
            </p>
          </div>
        </div>
      </div>

      {/* CONNECTION MODAL: Rendered outside main content for z-index control */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={closeConnectionModal}
        // Modal state managed by local component state
        // Connection logic handled by modal's internal form component
      />
    </DefaultLayout>
  );
}
