'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  const [showQRCode, setShowQRCode] = useState(false);

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
              <h2>Why I made this</h2>
              <p>
                I made this because I keep forgetting to submit assignments (might be a skill issue, to be honest). 
                As someone forgetful, it's a VERY TEDIOUS task to look through each course in Canvas just to have peace of mind. 
                It's also an opportunity for me to brush up on my web development skills. Yes, there is the mobile Canvas app 
                where I can see my todo list, but sometimes I'm too lazy to even use my phone and I want to access everything 
                within my PC. No harm in trying - this is absolutely free to use.
              </p>
            </section>

            <section className="about-section">
              <h2>Where can I contribute?</h2>
              <p>
                Here's the GitHub link: <a href="https://github.com/enriquezduane/animodo" target="_blank" rel="noopener noreferrer">https://github.com/enriquezduane/animodo</a>
              </p>
            </section>

            <section className="about-section">
              <h2>Buy me a coffee</h2>
              <p>If this website helps you, consider donating :)</p>
              <button 
                onClick={() => setShowQRCode(!showQRCode)}
                className="qr-toggle-btn"
              >
                {showQRCode ? 'Hide GCash QR Code' : 'Show GCash QR Code'}
              </button>
              
              {showQRCode && (
                <div className="qr-code-container">
                  <Image 
                    src="/gcash_qr_code.jpg" 
                    alt="GCash QR Code for donations" 
                    width={300} 
                    height={300}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 