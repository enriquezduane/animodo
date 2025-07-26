'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Canvas-URL': 'https://dlsu.instructure.com'
        }
      });

      if (response.ok) {
        localStorage.setItem('canvas_token', token);
        router.push('/dashboard');
      } else {
        setError('Invalid token. Please check your Canvas access token.');
      }
    } catch (err) {
      setError('Failed to validate token. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div>
      <h1>Animodo Dashboard</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="token">Canvas Access Token:</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your Canvas access token"
            required
          />
        </div>
        <button type="submit" disabled={isValidating}>
          {isValidating ? 'Validating...' : 'Access Dashboard'}
        </button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
} 