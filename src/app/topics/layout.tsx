/**
 * TOPICS LAYOUT - Ensures sidebar/header via DashboardLayout
 */

import { DefaultLayout } from '@/components/layout/default-layout';
import { Header } from '@/components/layout/header';
import { type ReactNode } from 'react';

export default function TopicsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <DefaultLayout header={<Header title="Topics" description="Manage Kafka topics, partitions, and configurations" />}>{children}</DefaultLayout>;
}

export const metadata = {
  title: 'Topics - Kafka Management UI',
  description: 'Manage your Kafka topics, partitions, and configurations',
};
