/**
 * UTILITY FUNCTIONS TESTS
 *
 * VITEST TESTING PATTERNS:
 * - describe/test blocks for organization
 * - Type-safe test expectations
 * - Mock functions for testing debounce
 * - Edge case testing for robustness
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { cn, debounce, delay, formatBytes, truncate } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    test('combines class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    test('handles conditional classes', () => {
      expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
    });

    test('merges Tailwind classes properly', () => {
      expect(cn('px-4 px-2')).toBe('px-2');
    });
  });

  describe('delay', () => {
    test('delays execution for specified milliseconds', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(95); // Allow for timing variations
    });
  });

  describe('formatBytes', () => {
    test('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    test('handles decimal precision', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 3)).toBe('1.5 KB');
    });
  });

  describe('truncate', () => {
    test('truncates long text', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    test('returns text as-is when shorter than limit', () => {
      expect(truncate('Hi', 5)).toBe('Hi');
    });

    test('returns text as-is when exactly at limit', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    test('debounces function calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenLastCalledWith('call3');
    });

    test('resets timer on subsequent calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('call1');
      vi.advanceTimersByTime(50);
      debouncedFn('call2');
      vi.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenLastCalledWith('call2');
    });
  });
});
