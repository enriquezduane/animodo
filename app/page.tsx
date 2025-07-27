'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiCalendar, FiExternalLink, FiBook, FiGift, FiLock, FiZap } from 'react-icons/fi';

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
                {/* Hero Section */}
                <div className="hero-section">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1>Never Miss Another Assignment</h1>
                            <p className="hero-subtitle">
                                Brings all your courses, assignments, and announcements together in one beautiful, organized view.
                            </p>
                        </div>
                        <div className="hero-image">
                            <Image
                                src="/animodo-landing.png"
                                alt="Animodo Dashboard Preview"
                                width={600}
                                height={400}
                                priority
                                className="landing-image"
                            />
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="cta-section-compact">
                    <div className="cta-container-compact">
                        <h2>Let's Hook You up to Your Dashboard!</h2>
                        <p>Just enter your Canvas access token to unlock your personalized dashboard</p>

                        <form onSubmit={handleSubmit} className="token-form-compact">
                            <div className="form-group-compact">
                                <label htmlFor="token">Canvas Access Token:</label>
                                <input
                                    type="text"
                                    id="token"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Paste your Canvas access token here"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={isValidating} className="access-btn-compact">
                                {isValidating ? 'Validating...' : 'Access Your Dashboard'}
                            </button>
                            {error && <p className="error">{error}</p>}
                        </form>

                        <div className="tutorial-link">
                            <Link href="/tutorial">Need help finding your Canvas access token?</Link>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="features-section">
                    <h2>Why You Might Love Animodo</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FiCalendar />
                            </div>
                            <h3>Clear Due Dates</h3>
                            <p>See exactly when every assignment is due with visual indicators that make deadlines impossible to miss.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FiExternalLink />
                            </div>
                            <h3>Direct Canvas Links</h3>
                            <p>Click any assignment or announcement to go directly to the original post in Canvas.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FiBook />
                            </div>
                            <h3>All Courses, One Place</h3>
                            <p>View assignments and announcements from all your courses in a unified, easy-to-scan dashboard.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FiGift />
                            </div>
                            <h3>Free & Open Source</h3>
                            <p>Completely free to use with transparent, open-source code.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FiLock />
                            </div>
                            <h3>Privacy First</h3>
                            <p>Your data stays on your device. Animodo doesn't store your information.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FiZap />
                            </div>
                            <h3>Blazing Fast</h3>
                            <p>Get instant access to all your course information without waiting for Canvas to load multiple pages.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 
