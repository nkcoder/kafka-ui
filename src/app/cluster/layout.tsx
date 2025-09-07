/**
 * CLUSTER LAYOUT - Next.js App Router Layout Component
 *
 * NEXT.JS LAYOUT PATTERNS:
 * - layout.tsx creates shared UI for route segments
 * - Automatically wraps page.tsx and nested routes
 * - Server Component by default for SEO and performance
 * - Provides consistent navigation and breadcrumbs
 *
 * REACT COMPONENT COMPOSITION:
 * - DefaultLayout provides overall page structure
 * - Header component with contextual title and description
 * - children prop renders nested page content
 * - Layout inheritance from parent layout.tsx
 *
 * TAILWINDCSS RESPONSIVE DESIGN:
 * - Consistent spacing and typography
 * - Mobile-first approach with responsive breakpoints
 * - Semantic color system for cluster management context
 */

import { DefaultLayout } from '@/components/layout/default-layout';
import { Header } from '@/components/layout/header';

interface ClusterLayoutProps {
  children: React.ReactNode;
}

/**
 * CLUSTER LAYOUT COMPONENT
 * 
 * Provides shared layout for cluster management pages
 * Includes navigation breadcrumbs and contextual header
 */
export default function ClusterLayout({ children }: ClusterLayoutProps) {
  return (
    <DefaultLayout
      header={
        <Header 
          title="Cluster Management" 
          description="Monitor brokers, health metrics, and cluster configuration"
        />
      }
    >
      {children}
    </DefaultLayout>
  );
}