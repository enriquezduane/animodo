'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {

    return (
        <div>
            <nav className="navbar">
                <div className="nav-container">
                    <Link href="/" className="nav-logo">
                        <Image src="/animodo-logo.svg" alt="Animodo" width={120} height={40} />
                    </Link>
                    <div className="nav-links">
                        <Link href="/">Home</Link>
                        <Link href="/about" className="active">About</Link>
                        <Link href="/tutorial">Tutorial</Link>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <div className="about-container">
                    <h1>About Animodo</h1>

                    <div className="about-content">
                        <section className="about-section">
                            <h2>What is Animodo</h2>
                            <p>
                                Animodo is a <strong>simple assignment/announcement tracker</strong> where you can view and manage your Canvas assignments and announcements in one place. It uses the Canvas LMS API to retrieve information directly from your courses to provide a clean and organized interface to help you stay on top of your academic responsibilities.
                            </p>
                        </section>

                        <section className="about-section">
                            <h2>Why I made this</h2>
                            <p>
                                I made this because I keep forgetting to submit assignments.
                                It's also an opportunity for me to brush up on my web development skills.
                                No harm in trying - this is <strong>absolutely free to use</strong>.
                            </p>
                        </section>

                        <section className="about-section">
                            <h2>I'm a developer! Where can I contribute?</h2>
                            <p>
                                Here's the GitHub link: <a href="https://github.com/enriquezduane/animodo" target="_blank" rel="noopener noreferrer">https://github.com/enriquezduane/animodo</a>
                            </p>
                        </section>

                        <section className="about-section">
                            <h2>Why is there no persistence capability</h2>
                            <p>
                                That's one disadvantage to this app. I wanted to implement Canvas OAuth <strong>Login with Canvas!</strong> but this requires me to ask someone with DLSU Canvas admin privileges to provide me authentication.  For now, enjoy a simple to use application without persistent login - you'll need to enter your access token each time you visit.
                            </p>
                        </section>


                    </div>
                </div>
            </main>
        </div>
    );
} 
