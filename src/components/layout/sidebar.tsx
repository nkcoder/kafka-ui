'use client';

/**
 * SIDEBAR NAVIGATION COMPONENT
 *
 * NEXT.JS ARCHITECTURE:
 * - 'use client': Required for components using browser APIs (hooks, events)
 * - App Router: File-based routing system (href='/topics' → src/app/topics/page.tsx)
 * - usePathname hook: Client-side navigation state, auto-updates on route changes
 * - Link component: Optimized navigation with prefetching and client-side routing
 *
 * REACT PATTERNS:
 * - Configuration-driven UI: navItems array defines all routes centrally
 * - Conditional styling: Active state changes appearance based on current route
 * - Map function: Transforms data array into JSX elements
 * - Semantic HTML: nav > ul > li structure for accessibility
 *
 * TAILWINDCSS LAYOUT:
 * - Fixed sidebar: w-64 (256px width) + h-full (100% height)
 * - Layout composition: Border, padding, and spacing create visual hierarchy
 * - Flexbox navigation: space-y-2 creates vertical spacing between nav items
 * - Interactive states: hover: and active states for user feedback
 * - Color system: Uses CSS custom properties for consistent theming
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarNavItem {
  title: string;
  href: string;
  icon: string;
  count?: number;
}

const navItems: SidebarNavItem[] = [
  { title: 'Dashboard', href: '/', icon: '📊' },
  { title: 'Clusters', href: '/cluster', icon: '🖥️' },
  { title: 'Topics', href: '/topics', icon: '📝' },
  { title: 'Consumers', href: '/consumers', icon: '👥' },
  { title: 'Producers', href: '/producers', icon: '🚀' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-sidebar border-r border-border h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Kafka UI</h1>
        <p className="text-sm text-muted-foreground mt-1">Cluster Management</p>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.title}</span>
                  {item.count !== undefined && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                      {item.count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Connection Status */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-sidebar">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-error rounded-full"></div>
          <span className="text-sm text-muted-foreground">Not Connected</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Configure cluster connection</p>
      </div>
    </div>
  );
}
