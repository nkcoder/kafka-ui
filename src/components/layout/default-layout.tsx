/**
 * DASHBOARD LAYOUT COMPONENT
 *
 * NEXT.JS LAYOUT PATTERN:
 * - Layout component wraps page content with consistent UI structure
 * - children prop: React's composition pattern for content injection
 * - Reusable across all dashboard pages (/, /topics, /brokers, etc.)
 *
 * CSS GRID VS FLEXBOX DECISION:
 * - Uses Flexbox here for sidebar + main content layout
 * - Flex direction row: sidebar (fixed width) + main (flexible width)
 * - Alternative: CSS Grid with 'grid-template-columns: 256px 1fr'
 *
 * TAILWINDCSS LAYOUT ARCHITECTURE:
 * - h-screen: Full viewport height (100vh)
 * - flex: Display flex container
 * - flex-1: Takes remaining space (flex-grow: 1)
 * - flex-col: Column direction for header + main stacking
 * - overflow-hidden: Prevents layout breaking with scrolling content
 * - Fixed sidebar + flexible main content pattern
 *
 * RESPONSIVE DESIGN:
 * - Sidebar hidden on mobile (would add md:block classes)
 * - Header adapts with responsive padding and layout
 */

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface DefaultLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function DefaultLayout({ header, children }: DefaultLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="relative">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">{header}</header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
