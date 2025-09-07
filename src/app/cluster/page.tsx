'use client';

/**
 * CLUSTER MANAGEMENT PAGE - NEXT.JS APP ROUTER
 *
 * NEXT.JS APP ROUTER PATTERNS:
 * - File-based routing: /cluster/page.tsx creates /cluster route
 * - 'use client' directive for client-side interactivity and hooks
 * - Layout inheritance from cluster/layout.tsx
 * - Server-side rendering with client-side hydration
 *
 * REACT COMPONENT ARCHITECTURE:
 * - Cluster management: list, add, switch, delete clusters
 * - Selected cluster details with broker management section
 * - Modal state management for adding/editing clusters
 * - Custom hooks for cluster and broker data management
 *
 * TAILWINDCSS RESPONSIVE DESIGN:
 * - Two-column layout: cluster list + selected cluster details
 * - Card-based design for cluster items and broker information
 * - Mobile-first responsive breakpoints
 * - Consistent spacing and semantic color system
 */

import { ConnectionModal } from '@/components/kafka/connection-modal';
import { BrokerList } from '@/components/kafka/broker-list';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useClusterConnection } from '@/hooks/use-cluster-connection';
import { useClusterManagement } from '@/hooks/use-cluster-management';
import { useBrokerManagement } from '@/hooks/use-brokers';
import { useClusterOverview } from '@/hooks/use-cluster-overview';
import { useState } from 'react';

/**
 * CLUSTER MANAGEMENT PAGE COMPONENT
 *
 * Main page for managing multiple Kafka clusters
 * Two-panel layout: cluster list + selected cluster details with broker management
 */
export default function ClusterPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { cluster: connectedCluster, isConnecting } = useClusterConnection();
  const { 
    clusters,
    isLoading: clustersLoading,
    error: clustersError,
    addCluster,
    removeCluster,
    selectCluster,
    disconnectCluster,
    selectedCluster,
    refetch: refetchClusters
  } = useClusterManagement();

  // Use the globally connected cluster as the active cluster
  const activeCluster = connectedCluster;
  
  const { overview, isLoading: overviewLoading, error: overviewError, refresh } = useClusterOverview();
  const {
    brokers,
    isLoadingBrokers,
    brokersError,
    refetchBrokers,
  } = useBrokerManagement();

  // EVENT HANDLERS
  const handleAddCluster = () => {
    // The ConnectionModal will handle the connection via useClusterConnection context
    setShowAddModal(false);
  };

  const handleSelectCluster = async (cluster: any) => {
    try {
      await selectCluster(cluster);
    } catch (error) {
      console.error('Failed to select cluster:', error);
    }
  };

  const handleRemoveCluster = async (clusterId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to remove this cluster?\n\n' +
      'This will only remove it from your saved clusters, not delete the actual Kafka cluster.'
    );

    if (confirmed) {
      try {
        await removeCluster(clusterId);
      } catch (error) {
        console.error('Failed to remove cluster:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* CLUSTER MANAGEMENT HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cluster Management</h1>
          <p className="text-muted-foreground">Manage and monitor your Kafka clusters</p>
        </div>
        
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
        >
          Add Cluster
        </Button>
      </div>

      {/* TWO-COLUMN LAYOUT: Cluster List + Selected Cluster Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* TailwindCSS responsive grid:
            - gap-6: 24px spacing between columns
            - lg:grid-cols-3: 3-column layout on desktop
            - First column spans 1, second spans 2 for proper proportions */}

        {/* LEFT PANEL: CLUSTER LIST */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Saved Clusters ({clusters.length})
              </h3>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refetchClusters}
                loading={clustersLoading}
              >
                Refresh
              </Button>
            </div>

            {clustersError && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-error">{clustersError}</p>
              </div>
            )}

            <div className="space-y-2">
              {clusters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-3xl mb-2">🖥️</div>
                  <p className="text-sm">No clusters configured</p>
                  <p className="text-xs mt-1">Add your first Kafka cluster to get started</p>
                </div>
              ) : (
                clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all duration-200
                      ${(activeCluster?.bootstrapServers === cluster.bootstrapServers || activeCluster?.name === cluster.name)
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted/20 border-border hover:bg-muted/40'
                      }
                    `}
                    onClick={() => handleSelectCluster(cluster)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <StatusIndicator
                          status={
                            cluster.status === 'connected' ? 'online' :
                            cluster.status === 'connecting' ? 'connecting' :
                            cluster.status === 'error' ? 'error' : 'warning'
                          }
                          size="sm"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate">
                            {cluster.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {cluster.bootstrapServers}
                          </p>
                          {cluster.version && (
                            <p className="text-xs text-muted-foreground">
                              v{cluster.version}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCluster(cluster.id);
                        }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED CLUSTER DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          {activeCluster ? (
            <>
              {/* CLUSTER INFO HEADER */}
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIndicator 
                      status={
                        activeCluster.status === 'connected' ? 'online' :
                        activeCluster.status === 'connecting' ? 'connecting' :
                        activeCluster.status === 'error' ? 'error' : 'warning'
                      }
                      size="lg" 
                    />
                    <div>
                      <h3 className="font-medium text-foreground">
                        {activeCluster.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {activeCluster.bootstrapServers}
                        {activeCluster.version && ` • Kafka v${activeCluster.version}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={refresh}
                      size="sm"
                      loading={overviewLoading}
                    >
                      Refresh
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={disconnectCluster}
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>

              {/* ERROR HANDLING: Show overview error if present */}
              {overviewError && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIndicator status="error" size="lg" />
                      <div>
                        <h3 className="font-medium text-foreground">Failed to Load Cluster Data</h3>
                        <p className="text-sm text-muted-foreground">{overviewError}</p>
                      </div>
                    </div>

                    <Button variant="outline" onClick={refresh} size="sm">
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {/* CLUSTER HEALTH METRICS */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Cluster Health"
                  value={
                    overview?.status === 'healthy' ? 'Healthy' :
                    overview?.status === 'warning' ? 'Warning' :
                    overview?.status === 'critical' ? 'Critical' : 'Unknown'
                  }
                  icon="💚"
                  status={overview?.status === 'unknown' ? 'critical' : overview?.status || 'critical'}
                  loading={overviewLoading}
                />

                <MetricCard
                  title="Brokers"
                  value={`${overview?.brokersOnline || 0}/${overview?.brokersTotal || 0}`}
                  icon="🖥️"
                  status={
                    (overview?.brokersOnline || 0) === 0 ? 'critical' :
                    (overview?.brokersOnline || 0) === (overview?.brokersTotal || 0) ? 'healthy' : 'warning'
                  }
                  loading={overviewLoading}
                />

                <MetricCard
                  title="Topics"
                  value={overview?.topicsCount || 0}
                  icon="📝"
                  status="healthy"
                  loading={overviewLoading}
                />

                <MetricCard
                  title="Partitions"
                  value={overview?.partitionsCount || 0}
                  icon="📊"
                  status="healthy"
                  loading={overviewLoading}
                />
              </div>

              {/* BROKER MANAGEMENT SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Kafka Brokers
                  </h3>
                  
                  <Button
                    variant="outline"
                    onClick={refetchBrokers}
                    size="sm"
                    loading={isLoadingBrokers}
                  >
                    Refresh Brokers
                  </Button>
                </div>

                <BrokerList
                  brokers={brokers}
                  isLoading={isLoadingBrokers || isConnecting}
                  error={brokersError}
                  onRefresh={refetchBrokers}
                />
              </div>

              {/* CLUSTER CONFIGURATION */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Configuration</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Bootstrap Servers</h4>
                    <p className="text-sm font-mono bg-muted/50 p-2 rounded border">
                      {activeCluster.bootstrapServers}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <div className="flex items-center gap-2">
                      <StatusIndicator 
                        status={activeCluster.status === 'connected' ? 'online' : 'error'} 
                        size="sm" 
                      />
                      <span className="text-sm capitalize">{activeCluster.status}</span>
                    </div>
                  </div>

                  {activeCluster.version && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Kafka Version</h4>
                      <p className="text-sm font-mono bg-muted/50 p-2 rounded border">
                        {activeCluster.version}
                      </p>
                    </div>
                  )}

                  {activeCluster.clusterId && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Cluster ID</h4>
                      <p className="text-sm font-mono bg-muted/50 p-2 rounded border">
                        {activeCluster.clusterId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* NO CLUSTER SELECTED STATE */
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Cluster Selected
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a cluster from the list to view its details and manage brokers, or add a new cluster to get started.
                </p>
                
                <Button
                  onClick={() => setShowAddModal(true)}
                  variant="primary"
                >
                  Add Your First Cluster
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD CLUSTER MODAL */}
      <ConnectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}