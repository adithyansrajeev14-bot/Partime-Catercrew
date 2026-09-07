import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'CaterCrew - Catering Job Marketplace',
  description: 'Mobile-first catering job marketplace connecting event companies with catering workers.',
  openGraph: {
    title: 'CaterCrew - Catering Job Marketplace',
    description: 'Mobile-first catering job marketplace connecting event companies with catering workers.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CaterCrew - Catering Job Marketplace',
    description: 'Mobile-first catering job marketplace connecting event companies with catering workers.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
