import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'zecompaign — AI-Powered Email Campaign Platform',
  description: 'Professional email campaign management with SMTP configuration, AI-powered template generation, and comprehensive analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{children}</body>
    </html>
  );
}
