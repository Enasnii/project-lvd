import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lakenvelder Design - Prijslijst',
  description: 'Bekijk onze complete prijslijst en beheer producten in een beveiligd admin-dashboard.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
