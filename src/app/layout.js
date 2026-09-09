import './globals.css';

export const metadata = {
  title: 'Fly Light — School of Badminton',
  description:
    'Premium badminton coaching academy in Tamil Nadu. Training programs for beginners to professionals. Expert coaches, state-ranked players.',
  keywords:
    'badminton, coaching, academy, Tamil Nadu, Fly Light, training, sports',

  icons: {
    icon: [
      {
        url: '/img/white-logo.png',
        type: 'image/png',
      },
    ],
    shortcut: '/img/white-logo.png',
    apple: '/img/white-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
