import Link from 'next/link';
import { Header } from '@/components/Header';

export default function DashboardPage() {
  return (
    <div>
      <Header />

      <main>
        <h2>Access Your Dashboard</h2>
        <p>To access your dashboard, please go to the homepage and enter your Canvas access token.</p>
        
        <Link href="/">Go to Homepage</Link>

        <h3>Need help getting your access token?</h3>
        <Link href="/tutorial">View our step-by-step tutorial</Link>

        <h3>Want to learn more about Animodo?</h3>
        <Link href="/about">Read about the project</Link>
      </main>
    </div>
  );
} 