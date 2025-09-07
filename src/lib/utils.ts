/**
 * UTILITY FUNCTIONS
 *
 * COMMON UTILITY PATTERNS:
 * - Class name concatenation with conditional logic
 * - Type-safe utility functions for common operations
 * - Performance optimized implementations
 * - Reusable across the entire application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * CLASS NAME UTILITY
 *
 * Combines clsx and tailwind-merge for optimal class handling:
 * - clsx: Conditional class names with clean syntax
 * - tailwind-merge: Resolves Tailwind class conflicts intelligently
 * - Results in clean, conflict-free CSS class strings
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * DELAY UTILITY
 *
 * Promise-based delay for async operations
 * Useful for testing loading states, rate limiting, etc.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * FORMAT BYTES UTILITY
 *
 * Converts bytes to human-readable format
 * Useful for displaying file sizes, memory usage, etc.
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * TRUNCATE TEXT UTILITY
 *
 * Safely truncates text with ellipsis
 * Prevents UI breaking with long strings
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

/**
 * DEBOUNCE UTILITY
 *
 * Debounces function calls for performance optimization
 * Useful for search inputs, API calls, etc.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
