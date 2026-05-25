import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root to calendar page
  redirect('/calendar');
}
