import Link from 'next/link';
import { Header } from '@/components/Header';

export default function AboutPage() {
  return (
    <div>
      <Header />

      <main>
        <h2>About Animodo</h2>
        
        <h3>What is Animodo?</h3>
        <p>Animodo is a comprehensive Canvas assignment tracker designed specifically for DLSU students. It helps you stay organized by providing a centralized view of your assignments, courses, and announcements from Canvas.</p>

        <h3>Features</h3>
        <ul>
          <li>Dashboard overview of all your courses</li>
          <li>Upcoming assignments with due dates and time remaining</li>
          <li>Unsubmitted assignments tracker</li>
          <li>Course announcements in one place</li>
          <li>Assignment counts and statistics</li>
          <li>Direct links to Canvas assignments</li>
          <li>Real-time data from Canvas</li>
        </ul>

        <h3>How It Works</h3>
        <p>Animodo connects to your DLSU Canvas account using a secure access token that you provide. This token allows the application to retrieve your course information, assignments, and announcements directly from Canvas.</p>

        <h3>Privacy & Security</h3>
        <ul>
          <li>Your access token is only stored locally in your browser session</li>
          <li>No personal data is stored on our servers</li>
          <li>All communication with Canvas is encrypted</li>
          <li>You can revoke access at any time by logging out or revoking your token in Canvas</li>
        </ul>

        <h3>Technical Details</h3>
        <ul>
          <li>Built with Next.js and React</li>
          <li>Uses the official Canvas API</li>
          <li>Responsive design for desktop and mobile</li>
          <li>Server-side rendering for optimal performance</li>
        </ul>

        <h3>Getting Started</h3>
        <p>To use Animodo:</p>
        <ol>
          <li>Get your Canvas access token by following our tutorial</li>
          <li>Enter your token in the homepage</li>
          <li>Start tracking your assignments!</li>
        </ol>

        <Link href="/tutorial">Learn how to get your access token</Link>
        
        <br />
        
        <Link href="/">Go to Homepage to get started</Link>
      </main>
    </div>
  );
} 