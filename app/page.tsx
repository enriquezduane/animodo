import Link from 'next/link';

export default function LandingPage() {
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
        <h2>Welcome to Animodo</h2>
        <p>Your comprehensive DLSU Canvas assignment tracker.</p>
        
        <p>Track your assignments, view announcements, and stay on top of your coursework all in one place.</p>

        <h3>Getting Started</h3>
        <p>To use Animodo, you'll need your Canvas access token.</p>
        
        <Link href="/tutorial">Don't know how to get your access token? Click here for a tutorial</Link>
        
        <p>Already have your access token?</p>
        <Link href="/dashboard">Go to Dashboard</Link>

        <p>Want to learn more about this project?</p>
        <Link href="/about">About Animodo</Link>
      </main>
    </div>
  );
}
