/**
 * LOADING SPINNER COMPONENT
 *
 * REACT COMPONENT PATTERNS:
 * - Pure functional component with TypeScript props
 * - Variant-based styling for different use cases
 * - Accessibility features with ARIA labels
 * - Size variants for different contexts
 *
 * TAILWINDCSS ANIMATION:
 * - CSS animations using Tailwind utility classes
 * - animate-spin for smooth rotation effect
 * - Responsive sizing with size variants
 * - Semantic color usage with CSS custom properties
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <output
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
        sizeClasses[size],
        className
      )}
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </output>
  );
}
