import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GMaps Scraper · B2B',
  description: 'Extract Google Maps leads (name, address, phone, site).',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
