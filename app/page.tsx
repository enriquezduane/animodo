'use client';

import { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
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
        <div style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
          <h1>Animodo - Canvas Tracker</h1>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
        <Dashboard accessToken={accessToken} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto' }}>
      <h1>Animodo - DLSU Assignment Tracker</h1>
      <p>Enter your Canvas access token to get started.</p>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="token">Canvas Access Token:</label>
          <input
            id="token"
            type="text"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Enter your Canvas access token"
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              border: '1px solid #ccc'
            }}
            required
          />
        </div>
        
        <button 
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Enter Dashboard
        </button>
      </form>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>How to get your Canvas access token:</strong></p>
        <ol>
          <li>Go to Canvas → Account → Settings</li>
          <li>Scroll down to "Approved Integrations"</li>
          <li>Click "+ New Access Token"</li>
          <li>Give it a purpose (e.g., "Animodo Dashboard")</li>
          <li>Copy the generated token</li>
        </ol>
      </div>
    </div>
  );
}
