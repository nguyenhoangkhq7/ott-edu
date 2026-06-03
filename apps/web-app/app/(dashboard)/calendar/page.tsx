import CalendarPage from "@/modules/calendar/CalendarPage";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function Calendar() {
  return <CalendarPage />;
}