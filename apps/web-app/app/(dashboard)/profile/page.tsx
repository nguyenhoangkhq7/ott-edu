import ProfileOverviewPage from "@/modules/account/ProfileOverviewPage";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function Page() {
  return <ProfileOverviewPage />;
}
