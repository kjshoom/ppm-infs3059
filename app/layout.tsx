import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PPM — Project Portfolio Management',
  description:
    'A focused meeting prototype for structured, human-led review of IT project proposals.',
  openGraph: {
    title: 'PPM — Project Portfolio Management',
    description:
      'A focused meeting prototype for structured, human-led review of IT project proposals.',
    url: 'https://kjshoom.github.io/ppm-review-meeting-prototype/',
    type: 'website',
    images: ['https://kjshoom.github.io/ppm-review-meeting-prototype/public/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PPM — Project Portfolio Management',
    description:
      'A focused meeting prototype for structured, human-led review of IT project proposals.',
    images: ['https://kjshoom.github.io/ppm-review-meeting-prototype/public/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
