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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Montserrat:wght@700;900&family=Oswald:wght@700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Poppins:wght@700;800;900&family=Space+Grotesk:wght@700&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
