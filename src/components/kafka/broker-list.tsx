'use client';

/**
 * BROKER LIST COMPONENT - Kafka Broker Management UI
 *
 * REACT COMPONENT PATTERNS:
 * - Functional component with TypeScript props interface
 * - Conditional rendering for loading, error, and empty states
 * - Event handling for broker actions (view details)
 * - State management for modal visibility and selected broker
 *
 * TAILWINDCSS RESPONSIVE TABLE DESIGN:
 * - Mobile-first approach with responsive breakpoints
 * - Card layout on mobile, table layout on desktop
 * - Consistent spacing and typography hierarchy
 * - Status indicators with semantic color coding
 *
 * KAFKA BROKER MANAGEMENT:
 * - Real-time broker status monitoring
 * - Broker configuration and metrics display
 * - Health indicators for operational status
 * - Performance metrics and resource utilization
 */

import { BrokerDetailsModal } from '@/components/kafka/broker-details-modal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Broker } from '@/types/kafka';
import { useState } from 'react';

interface BrokerListProps {
  brokers: Broker[];
  isLoading: boolean;
  error?: string | null;
  onRefresh: () => void;
}

/**
 * BROKER LIST COMPONENT
 *
 * Displays Kafka brokers in a responsive table format
 * Shows broker status, endpoints, and performance metrics
 */
export function BrokerList({ brokers, isLoading, error, onRefresh }: BrokerListProps) {
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // EVENT HANDLERS: Broker interaction functions
  const handleViewDetails = (broker: Broker) => {
    setSelectedBroker(broker);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBroker(null);
  };

  // LOADING STATE: Show spinner during data fetch
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        {/* TailwindCSS card container with consistent styling */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <LoadingSpinner size="md" />
            <span className="text-muted-foreground">Loading brokers...</span>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE: Show error message with retry option
  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Failed to Load Brokers
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          
          <Button onClick={onRefresh} variant="primary">
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  // EMPTY STATE: Show message when no brokers are available
  if (!brokers || brokers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🖥️</div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Brokers Found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            No Kafka brokers are currently available in this cluster.
          </p>
          
          <Button onClick={onRefresh} variant="outline">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // TABLE COLUMNS: Define responsive table structure
  const columns = [
    {
      header: 'Broker ID',
      accessor: 'id' as keyof Broker,
      className: 'font-mono text-sm',
    },
    {
      header: 'Status',
      accessor: 'status' as keyof Broker,
      className: '',
      render: (broker: Broker) => (
        <div className="flex items-center gap-2">
          <StatusIndicator
            status={
              broker.status === 'online' ? 'online' :
              broker.status === 'offline' ? 'error' : 'warning'
            }
            size="sm"
          />
          <span className="capitalize text-sm">
            {broker.status}
          </span>
          {broker.isController && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded ml-2">
              Controller
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Host',
      accessor: 'host' as keyof Broker,
      className: 'font-mono text-sm',
    },
    {
      header: 'Port',
      accessor: 'port' as keyof Broker,
      className: 'font-mono text-sm',
    },
    {
      header: 'Topics',
      accessor: 'topicCount' as keyof Broker,
      className: 'text-center',
      render: (broker: Broker) => (
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
          {broker.topicCount || 0}
        </span>
      ),
    },
    {
      header: 'Partitions',
      accessor: 'partitionCount' as keyof Broker,
      className: 'text-center',
      render: (broker: Broker) => (
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-secondary/10 text-secondary rounded">
          {broker.partitionCount || 0}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id' as keyof Broker,
      className: 'text-right',
      render: (broker: Broker) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(broker)}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* BROKER LIST HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            Brokers ({brokers.length})
          </h3>
          
          {/* BROKER STATUS SUMMARY */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <StatusIndicator status="online" size="sm" />
              <span className="text-muted-foreground">
                {brokers.filter(b => b.status === 'online').length} Online
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <StatusIndicator status="error" size="sm" />
              <span className="text-muted-foreground">
                {brokers.filter(b => b.status === 'offline').length} Offline
              </span>
            </div>

            <div className="flex items-center gap-1">
              <StatusIndicator status="warning" size="sm" />
              <span className="text-muted-foreground">
                {brokers.filter(b => b.status === 'degraded').length} Degraded
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onRefresh}
          size="sm"
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* RESPONSIVE BROKER TABLE */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* TailwindCSS: overflow-hidden ensures border radius is respected */}
        
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className || ''}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brokers.map((broker) => (
              <TableRow key={broker.id}>
                {columns.map((column, index) => (
                  <TableCell key={index} className={column.className || ''}>
                    {column.render ? column.render(broker) : String(broker[column.accessor])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE-FRIENDLY BROKER CARDS (Alternative to table on small screens) */}
      <div className="block md:hidden space-y-3">
        {/* TailwindCSS: Show only on mobile, hidden on md+ screens */}
        
        {brokers.map((broker) => (
          <div 
            key={broker.id} 
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    Broker {broker.id}
                  </span>
                  <StatusIndicator
                    status={
                      broker.status === 'online' ? 'online' :
                      broker.status === 'offline' ? 'error' : 'warning'
                    }
                    size="sm"
                  />
                  {broker.isController && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded">
                      Controller
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>📍 {broker.host}:{broker.port}</div>
                  <div>📝 {broker.topicCount || 0} topics</div>
                  <div>📊 {broker.partitionCount || 0} partitions</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(broker)}
              >
                Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* BROKER DETAILS MODAL */}
      <BrokerDetailsModal
        broker={selectedBroker}
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
      />
    </div>
  );
}