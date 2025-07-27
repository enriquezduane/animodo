'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
            <nav className="navbar">
                <div className="nav-container">
                    <Link href="/" className="nav-logo">
                        <Image src="/animodo-logo.svg" alt="Animodo" width={120} height={40} />
                    </Link>
                    <div className="nav-links">
                        <Link href="/" className="active">Home</Link>
                        <Link href="/about">About</Link>
                        <Link href="/tutorial">Tutorial</Link>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <div className="landing-container">
                    <h1>Animodo Dashboard</h1>

                    <form onSubmit={handleSubmit} className="token-form">
                        <div className="form-group">
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
                        <button type="submit" disabled={isValidating} className="access-btn">
                            {isValidating ? 'Validating...' : 'Access Dashboard'}
                        </button>
                        {error && <p className="error">{error}</p>}
                    </form>

                    <div className="tutorial-link">
                        <Link href="/tutorial">How to find your Canvas access token</Link>
                    </div>

                    <div className="marketing-content">
                        <ul>
                            <li>Never miss an assignment again!</li>
                            <li>See all your assignments and announcements <strong>all in one place</strong></li>
                            <li>Free, and Open Source!</li>
                            <li>Secure. Data is only stored locally.</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
} 
