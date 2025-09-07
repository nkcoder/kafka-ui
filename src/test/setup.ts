/**
 * VITEST SETUP FILE
 *
 * TESTING ENVIRONMENT CONFIGURATION:
 * - Extends expect with @testing-library/jest-dom matchers
 * - Configures global test utilities
 * - Sets up mocks for browser APIs
 * - Provides test helpers and utilities
 */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

// Make React available globally for JSX in tests
globalThis.React = React;

// MOCK BROWSER APIS
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// MOCK LOCAL STORAGE
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// MOCK RESIZE OBSERVER
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// MOCK INTERSECTION OBSERVER
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
