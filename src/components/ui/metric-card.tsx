import { ReactNode } from 'react';

/**
 * METRIC CARD COMPONENT
 *
 * REACT ARCHITECTURE:
 * - Compound state management: Handles loading, data, and trend states
 * - Conditional rendering: Shows skeleton OR content based on loading state
 * - Type safety: Union types ensure only valid status/trend values
 * - Composition pattern: Accepts ReactNode for flexible icon rendering
 *
 * TAILWINDCSS DESIGN SYSTEM:
 * - Card pattern: bg-card + border + rounded-lg creates consistent card design
 * - Status borders: border-l-4 creates colored left accent (4 = 4px)
 * - Spacing system: p-6 (24px), mb-2 (8px), gap-2 (8px) - consistent 8px grid
 * - Typography scale: text-sm (14px) → text-2xl (24px) creates visual hierarchy
 * - Color system: Uses semantic CSS variables (--color-success, etc.)
 *
 * CSS LAYOUT BREAKDOWN:
 * - flex items-start justify-between: Flexbox with top alignment and space distribution
 * - flex-1: Takes remaining space in flex container
 * - animate-pulse: Shimmer effect for loading states
 * - font-bold: font-weight: 700 for emphasis
 * - rounded: border-radius utilities (rounded-lg = 8px)
 */

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  status?: 'healthy' | 'warning' | 'critical';
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  status = 'healthy',
  loading = false,
}: MetricCardProps) {
  const statusColors = {
    healthy: 'border-l-success',
    warning: 'border-l-warning',
    critical: 'border-l-error',
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    stable: 'text-muted-foreground',
  };

  return (
    <div
      className={`bg-card border border-border rounded-lg p-6 border-l-4 ${statusColors[status]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-secondary rounded w-20 mb-2"></div>
              <div className="h-4 bg-secondary rounded w-16"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-card-foreground mb-1">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>

              {trend && (
                <div className={`text-xs ${trendColors[trend.direction]} flex items-center gap-1`}>
                  <span>
                    {trend.direction === 'up' && '↗'}
                    {trend.direction === 'down' && '↘'}
                    {trend.direction === 'stable' && '→'}
                  </span>
                  {trend.value}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
