import type {Metadata} from 'next';
import { Geist_Sans } from 'geist/font/sans'; // Correct import for Geist Sans
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

const geistSans = Geist_Sans({ // Correct usage
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Geist Mono is not explicitly used but kept for consistency if needed later
// import { Geist_Mono } from 'geist/font/mono';
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'SnapClaim - Invoice Processing',
  description: 'Easily capture, extract, and verify invoice data with SnapClaim.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable}`}>
      <body className={`antialiased font-sans`}> {/* Use font-sans which maps to --font-geist-sans */}
        {children}
        <Toaster /> {/* Add Toaster here for global toast notifications */}
      </body>
    </html>
  );
}
