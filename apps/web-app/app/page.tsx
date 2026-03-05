import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root to teams page
  redirect('/teams');
}
