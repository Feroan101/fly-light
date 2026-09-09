import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <Link href="/" className="footer-logo">FlyLight</Link>

          <nav className="footer-nav">
            <Link href="/">Home</Link>
            <Link href="/achievements">Achievements</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/gallery/videos">Videos</Link>
            <Link href="/resources">Resources</Link>
          </nav>

          <p className="footer-copy">
            Copyright &copy; {year} All rights reserved by FlyLight
          </p>
        </div>
      </div>
    </footer>
  );
}
