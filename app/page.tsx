'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dashboard } from '@/components/Dashboard';
import { Header } from '@/components/Header';

export default function LandingPage() {
  const [accessToken, setAccessToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessToken.trim()) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setAccessToken('');
    setIsLoggedIn(false);
  };

  if (isLoggedIn) {
    return (
      <div>
        <Header showLogout={true} onLogout={handleLogout} />
        <Dashboard accessToken={accessToken} />
      </div>
    );
  }

  return (
    <div>
      <Header />

      <main>
        {/* Project Title */}
        <h1>Animodo</h1>
        <h2>DLSU Canvas Assignment Tracker</h2>

        {/* What it does */}
        <section>
          <h3>What does Animodo do?</h3>
          <p>Animodo is your comprehensive DLSU Canvas assignment tracker that helps you stay organized and never miss a deadline.</p>
          <ul>
            <li>Track all your assignments with due dates and time remaining</li>
            <li>View unsubmitted assignments at a glance</li>
            <li>Get course announcements in one centralized location</li>
            <li>See assignment statistics across all your courses</li>
            <li>Direct links to Canvas for easy access</li>
          </ul>
        </section>

        {/* Image of dashboard placeholder */}
        <section>
          <h3>See your Canvas data organized</h3>
          <div>
            [Dashboard Preview Image - Coming Soon]
            <p>A clean, organized view of all your Canvas assignments, announcements, and course information.</p>
          </div>
        </section>

        {/* Input access token */}
        <section>
          <h3>Get Started Now</h3>
          <p>Enter your Canvas access token to access your personalized dashboard:</p>
          
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="token">Canvas Access Token:</label>
              <input
                id="token"
                type="text"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter your Canvas access token"
                required
              />
            </div>
            
            <button type="submit">
              Access My Dashboard
            </button>
          </form>

          <p>Don't know how to get your access token? <Link href="/tutorial">Click here for a step-by-step tutorial</Link></p>
        </section>

        {/* Marketing */}
        <section>
          <h3>Why Choose Animodo?</h3>
          
          <div>
            <h4>Never Miss Another Deadline</h4>
            <p>Get a clear overview of upcoming assignments with countdown timers showing exactly how much time you have left.</p>
          </div>

          <div>
            <h4>Stay Organized</h4>
            <p>All your courses, assignments, and announcements in one place. No more switching between multiple Canvas pages.</p>
          </div>

          <div>
            <h4>Built for DLSU Students</h4>
            <p>Specifically designed to work seamlessly with DLSU's Canvas system. Created by students, for students.</p>
          </div>

          <div>
            <h4>Secure & Private</h4>
            <p>Your access token stays in your browser. We never store your personal information on our servers.</p>
          </div>

          <div>
            <h4>Real-time Data</h4>
            <p>Always up-to-date information pulled directly from Canvas. Refresh anytime to get the latest assignments and announcements.</p>
          </div>

          <div>
            <h4>Free Forever</h4>
            <p>Animodo is completely free to use. No subscriptions, no hidden fees, no premium features locked behind paywalls.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <p>Animodo - DLSU Canvas Tracker</p>
        <nav>
          <Link href="/about">About</Link>
          <Link href="/tutorial">Tutorial</Link>
        </nav>
        <p>Built for DLSU students. Your data stays private and secure.</p>
      </footer>
    </div>
  );
}
