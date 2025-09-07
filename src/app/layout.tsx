/**
 * ROOT LAYOUT - Next.js App Router
 *
 * NEXT.JS LAYOUT HIERARCHY:
 * - Root layout wraps ALL pages in the application
 * - Perfect place for global providers (Context, state management)
 * - Font loading and global CSS imports happen here
 * - Metadata configuration for SEO and browser behavior
 *
 * REACT PROVIDER PATTERN:
 * - ClusterProvider wraps entire app to share connection state
 * - Provider makes React Context available to all child components
 * - Prevents prop drilling for global state like authentication, themes, etc.
 */

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ErrorBoundary } from '@/components/error-boundary';
import { ClusterProvider } from '@/hooks/use-cluster-connection';
import './globals.css';

// NEXT.JS FONT OPTIMIZATION
// - Fonts are loaded at build time and served from same origin
// - CSS variables allow usage in TailwindCSS configuration
// - Subset loading reduces bundle size
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// SEO AND METADATA CONFIGURATION
export const metadata: Metadata = {
  title: 'Kafka UI - Cluster Management Dashboard',
  description:
    'Modern web application for managing and monitoring Apache Kafka clusters, topics, brokers, and consumers.',
  // Could add more metadata: icons, viewport, openGraph, etc.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* FONT VARIABLES: Available throughout CSS via var(--font-geist-sans) */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* TailwindCSS: antialiased = font smoothing for better text rendering */}

        {/* ERROR BOUNDARY: Catches and handles JavaScript errors gracefully */}
        <ErrorBoundary>
          {/* GLOBAL STATE PROVIDER: Makes cluster connection available app-wide */}
          <ClusterProvider>
            {children}
            {/* All page components will have access to cluster context */}
          </ClusterProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
