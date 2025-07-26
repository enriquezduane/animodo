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
            <p>To find your access token make sure you are logged in at <a href="http://dlsu.instructure.com/" target="_blank" rel="noopener noreferrer">http://dlsu.instructure.com/</a></p>
            
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

            <p>Then look for 'Settings'</p>
            <div className="tutorial-image">
              <Image 
                src="/tutorial_2.png" 
                alt="Look for Settings" 
                width={800} 
                height={400}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <p>Scroll down and you should be able to find '+ New Access Token' under the Approved Integrations Header</p>
            <div className="tutorial-image">
              <Image 
                src="/tutorial_3.png" 
                alt="Find New Access Token" 
                width={800} 
                height={400}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <p>Make sure to populate 'Purpose', it can be anything. you can type 'Animodo'. You may leave expiration date and time empty, then click 'generate token'</p>
            <div className="tutorial-image">
              <Image 
                src="/tutorial_4.png" 
                alt="Generate token" 
                width={800} 
                height={400}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <p>Finally, copy the token. I suggest putting this somewhere safe, your notes app so when you come back you can use this token over and over again.</p>
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
              <p><strong>For your peace of mind:</strong> I do not store your access token in my database (there is no database to begin with). It will only be used to interact with the Official Canvas LMS API. You may revoke it anytime through canvas if you want to opt out.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 