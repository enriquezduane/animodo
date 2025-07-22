'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dashboard } from '@/components/Dashboard';

export default function DashboardPage() {
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
        <header>
          <h1>Animodo - Canvas Tracker</h1>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/tutorial">Tutorial</Link>
            <Link href="/about">About</Link>
            <Link href="/dashboard">Dashboard</Link>
            <button onClick={handleLogout}>Logout</button>
          </nav>
        </header>
        <Dashboard accessToken={accessToken} />
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>Animodo - DLSU Canvas Tracker</h1>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/tutorial">Tutorial</Link>
          <Link href="/about">About</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <main>
        <h2>Dashboard Access</h2>
        <p>Enter your Canvas access token to access your dashboard.</p>
        
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
            Enter Dashboard
          </button>
        </form>

        <h3>Don't have an access token?</h3>
        <Link href="/tutorial">Learn how to get your Canvas access token</Link>

        <h3>Need help?</h3>
        <Link href="/about">Learn more about Animodo</Link>
      </main>
    </div>
  );
} 