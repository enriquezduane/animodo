import Link from 'next/link';

interface HeaderProps {
  showLogout?: boolean;
  onLogout?: () => void;
}

export function Header({ showLogout = false, onLogout }: HeaderProps) {
  return (
    <header>
      <div>
        <Link href="/">
          <h1>Animodo - DLSU Canvas Tracker</h1>
        </Link>
      </div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/tutorial">Tutorial</Link>
        <Link href="/about">About</Link>
        {!showLogout && <Link href="/dashboard">Dashboard</Link>}
        {showLogout && onLogout && (
          <button onClick={onLogout}>Logout</button>
        )}
      </nav>
    </header>
  );
} 