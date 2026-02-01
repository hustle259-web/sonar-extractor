import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GMaps Extractor · Lead Gen B2B',
  description: 'Extrayez des leads Google Maps (nom, adresse, tél, site) par recherche.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
