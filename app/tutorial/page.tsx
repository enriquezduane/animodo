'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function TutorialPage() {
    return (
        <div>
            <nav className="navbar">
                <div className="nav-container">
                    <Link href="/" className="nav-logo">
                        <Image src="/animodo-logo.svg" alt="Animodo" width={120} height={40} />
                    </Link>
                    <div className="nav-links">
                        <Link href="/">Home</Link>
                        <Link href="/about">About</Link>
                        <Link href="/tutorial" className="active">Tutorial</Link>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <div className="tutorial-container">
                    <h1>How to Get Canvas Access Token</h1>

                    <div className="tutorial-content">
                        <p>To find your access token, make sure you are logged in at <a href="http://dlsu.instructure.com/" target="_blank" rel="noopener noreferrer">http://dlsu.instructure.com/</a></p>

                        <p>Navigate through your profile icon located at the top left</p>
                        <div className="tutorial-image">
                            <Image
                                src="/tutorial_1.png"
                                alt="Navigate to profile icon"
                                width={800}
                                height={400}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>

                        <p>Then look for <strong>Settings</strong></p>
                        <div className="tutorial-image">
                            <Image
                                src="/tutorial_2.png"
                                alt="Look for Settings"
                                width={800}
                                height={400}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>

                        <p>Scroll down and you should be able to find <strong>'+ New Access Token'</strong> under the Approved Integrations Header</p>
                        <div className="tutorial-image">
                            <Image
                                src="/tutorial_3.png"
                                alt="Find New Access Token"
                                width={800}
                                height={400}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>

                        <p>Make sure to populate <code>Purpose</code> - it can be anything. You can type <strong>Animodo</strong>. You may leave expiration date and time empty, then click <strong>generate token</strong></p>
                        <div className="tutorial-image">
                            <Image
                                src="/tutorial_4.png"
                                alt="Generate token"
                                width={800}
                                height={400}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>

                        <p>Finally, copy the token. I suggest putting this somewhere safe like your notes app , so when you come back you can use this token over and over again. You can always regenerate a token in case you lose it.</p>
                        <div className="tutorial-image">
                            <Image
                                src="/tutorial_5.png"
                                alt="Copy the token"
                                width={800}
                                height={400}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>

                        <div className="security-note">
                            <p>For your peace of mind: I do <strong>not</strong> store your access token in my database (there is no database to begin with). It will only be used to interact with the Official Canvas LMS API. You may revoke it anytime through Canvas if you want to opt out.</p>
                        </div>

                        <div className="tutorial-footer">
                            <Link href="/" className="back-to-home-btn">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .tutorial-footer {
                    margin-top: var(--spacing-2xl);
                    text-align: center;
                    padding-top: var(--spacing-xl);
                    border-top: 2px solid var(--border-color);
                }

                .back-to-home-btn {
                    display: inline-block;
                    background: var(--primary-color);
                    color: white;
                    text-decoration: none;
                    padding: var(--spacing-md) var(--spacing-2xl);
                    border-radius: 0;
                    font-size: var(--font-size-base);
                    font-weight: 600;
                    transition: all 0.2s ease;
                    box-shadow: var(--shadow-sm);
                    border: 2px solid var(--primary-color);
                }

                .back-to-home-btn:hover {
                    background: var(--accent-color);
                    border-color: var(--accent-color);
                    color: var(--dark-gray);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    text-decoration: none;
                }

                .back-to-home-btn:active {
                    transform: translateY(0);
                }
            `}</style>
        </div>
    );
} 
