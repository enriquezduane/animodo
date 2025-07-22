import Link from 'next/link';

export default function TutorialPage() {
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
        <h2>How to Get Your Canvas Access Token</h2>
        
        <p>Follow these steps to get your Canvas access token:</p>

        <ol>
          <li>Go to the DLSU Canvas website: https://dlsu.instructure.com</li>
          <li>Log in with your DLSU credentials</li>
          <li>Click on your profile picture in the top right corner</li>
          <li>Select "Account" from the dropdown menu</li>
          <li>Click on "Settings" from the left sidebar</li>
          <li>Scroll down to the "Approved Integrations" section</li>
          <li>Click the "+ New Access Token" button</li>
          <li>Enter a purpose for the token (e.g., "Animodo Dashboard")</li>
          <li>Optionally set an expiration date (leave blank for no expiration)</li>
          <li>Click "Generate Token"</li>
          <li>Copy the generated token immediately (it will only be shown once)</li>
          <li>Store the token safely - you'll need it to access your dashboard</li>
        </ol>

        <h3>Important Security Notes:</h3>
        <ul>
          <li>Your access token is like a password - keep it secure</li>
          <li>Don't share your token with anyone</li>
          <li>If you think your token has been compromised, revoke it and generate a new one</li>
          <li>Animodo only stores your token locally in your browser session</li>
        </ul>

        <h3>Ready to Use Your Token?</h3>
        <Link href="/dashboard">Go to Dashboard</Link>

        <h3>Need More Help?</h3>
        <p>If you're having trouble getting your access token, you can:</p>
        <ul>
          <li>Contact DLSU IT support</li>
          <li>Refer to the Canvas documentation</li>
          <li>Ask a classmate who has already set up their token</li>
        </ul>

        <Link href="/">Back to Home</Link>
      </main>
    </div>
  );
} 