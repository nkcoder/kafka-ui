'use client';

/**
 * BROKER DETAILS MODAL COMPONENT - Detailed Broker Information
 *
 * REACT COMPONENT PATTERNS:
 * - Functional component with conditional rendering
 * - TypeScript interfaces for type safety
 * - Modal overlay with accessibility considerations
 * - Tab-based navigation for different information sections
 *
 * TAILWINDCSS MODAL DESIGN:
 * - Fixed positioning with backdrop blur
 * - Card-based layout with consistent spacing
 * - Responsive design for different screen sizes
 * - Tab interface for organizing information
 *
 * KAFKA BROKER DETAILS:
 * - General broker information and status
 * - Configuration parameters and settings
 * - Performance metrics and health indicators
 * - Connection and network information
 */

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Broker } from '@/types/kafka';
import { useState } from 'react';

interface BrokerDetailsModalProps {
  broker: Broker | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'metrics' | 'configuration';

/**
 * BROKER DETAILS MODAL COMPONENT
 *
 * Shows detailed information about a selected Kafka broker
 * Organized in tabs: Overview, Metrics, and Configuration
 */
export function BrokerDetailsModal({ broker, isOpen, onClose }: BrokerDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!broker) {
    return null;
  }

  // TAB CONFIGURATION
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📋' },
    { key: 'metrics', label: 'Metrics', icon: '📊' },
    { key: 'configuration', label: 'Configuration', icon: '⚙️' },
  ];

  // FORMAT BYTES: Convert bytes to human readable format
  const formatBytes = (bytes: number | undefined): string => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // FORMAT NUMBER: Add thousand separators
  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Broker ${broker.id} Details`}
      size="xl"
    >
      <div className="space-y-6">
        {/* BROKER HEADER INFO */}
        <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
          <StatusIndicator
            status={
              broker.status === 'online' ? 'online' :
              broker.status === 'offline' ? 'error' : 'warning'
            }
            size="lg"
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                Broker {broker.id}
              </h3>
              
              {broker.isController && (
                <span className="inline-flex items-center px-2 py-1 text-sm font-medium bg-primary/20 text-primary rounded">
                  🎛️ Controller
                </span>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {broker.host}:{broker.port}
              {broker.rack && ` • Rack: ${broker.rack}`}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-foreground capitalize">
              {broker.status}
            </p>
            <p className="text-xs text-muted-foreground">
              {broker.topicCount || 0} topics, {broker.partitionCount || 0} partitions
            </p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex space-x-1 bg-muted/20 p-1 rounded-lg">
          {/* TailwindCSS tab styling with active state management */}
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors
                ${activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="min-h-[300px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* GENERAL INFORMATION */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Connection Info</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Host:</span>
                      <span className="text-sm font-mono text-foreground">{broker.host}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Port:</span>
                      <span className="text-sm font-mono text-foreground">{broker.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rack:</span>
                      <span className="text-sm font-mono text-foreground">{broker.rack || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Role & Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <div className="flex items-center gap-2">
                        <StatusIndicator
                          status={
                            broker.status === 'online' ? 'online' :
                            broker.status === 'offline' ? 'error' : 'warning'
                          }
                          size="sm"
                        />
                        <span className="text-sm capitalize text-foreground">{broker.status}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Controller:</span>
                      <span className="text-sm text-foreground">
                        {broker.isController ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WORKLOAD INFORMATION */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Workload Distribution</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{broker.topicCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Topics</div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{broker.partitionCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Partitions</div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">
                        {broker.partitionCount && broker.topicCount 
                          ? Math.round((broker.partitionCount / broker.topicCount) * 100) / 100 
                          : 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Partitions/Topic</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {broker.metrics ? (
                <>
                  {/* PERFORMANCE METRICS */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Performance Metrics</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">Requests/sec</div>
                            <div className="text-xl font-bold text-foreground">
                              {formatNumber(broker.metrics.requestsPerSecond)}
                            </div>
                          </div>
                          <div className="text-2xl">🚀</div>
                        </div>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">Disk Usage</div>
                            <div className="text-xl font-bold text-foreground">
                              {formatBytes(broker.metrics.diskUsage)}
                            </div>
                          </div>
                          <div className="text-2xl">💾</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NETWORK METRICS */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Network Activity</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">Network In</div>
                            <div className="text-xl font-bold text-foreground">
                              {formatBytes(broker.metrics.networkIn)}/s
                            </div>
                          </div>
                          <div className="text-2xl">📥</div>
                        </div>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">Network Out</div>
                            <div className="text-xl font-bold text-foreground">
                              {formatBytes(broker.metrics.networkOut)}/s
                            </div>
                          </div>
                          <div className="text-2xl">📤</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Metrics Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Broker metrics are not currently available. This may be due to JMX not being enabled or network connectivity issues.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'configuration' && (
            <div className="space-y-6">
              {broker.config && Object.keys(broker.config).length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Broker Configuration</h4>
                  <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {Object.entries(broker.config).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-border/30 last:border-b-0">
                          <span className="text-sm font-mono text-muted-foreground">{key}:</span>
                          <span className="text-sm font-mono text-foreground ml-4 truncate">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⚙️</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Configuration Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Broker configuration details are not currently available.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL ACTIONS */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}