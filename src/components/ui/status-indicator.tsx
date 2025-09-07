/**
 * STATUS INDICATOR COMPONENT
 *
 * REACT DESIGN PATTERN: Compound Component
 * - Single component handles both visual indicator and optional text
 * - Uses TypeScript union types for strict status values
 * - Default parameters (size = 'md') demonstrate React best practices
 *
 * TAILWINDCSS ARCHITECTURE:
 * - Utility-first approach: Each class does one thing well
 * - Responsive design: Classes adapt to screen sizes automatically
 * - Custom properties integration: bg-success uses CSS variables from globals.css
 * - Dynamic class composition: Template literals combine static and dynamic classes
 *
 * CSS CLASS BREAKDOWN:
 * - flex items-center gap-2: Flexbox layout with centered alignment and spacing
 * - rounded-full: Creates perfect circle (border-radius: 9999px)
 * - w-* h-*: Width and height utilities (w-3 = 0.75rem = 12px)
 * - animate-pulse: Built-in animation for loading states
 * - text-sm: Font size utility (14px)
 * - capitalize: Text transform utility
 */

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'error' | 'connecting';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({ status, label, size = 'md' }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-muted',
    warning: 'bg-warning',
    error: 'bg-error',
    connecting: 'bg-primary animate-pulse',
  };

  return (
    <div className="flex items-center gap-2">
      <output
        className={`rounded-full ${sizeClasses[size]} ${statusColors[status]}`}
        aria-label={`Status: ${status}`}
      />
      {label && <span className="text-sm text-muted-foreground capitalize">{label}</span>}
    </div>
  );
}
