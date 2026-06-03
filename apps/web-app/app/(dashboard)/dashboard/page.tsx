import DashboardPageClient from './DashboardPageClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function DashboardPage() {
  return <DashboardPageClient />;
}
