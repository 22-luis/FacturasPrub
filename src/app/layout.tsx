import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans'; // Import GeistSans font object
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/contexts/AuthContext';

// GeistSans from 'geist/font/sans' is an object, not a function to be called.
// Its properties like .variable are accessed directly.

// Geist Mono is not explicitly used but kept for consistency if needed later
// import { GeistMono } from 'geist/font/mono';
// const geistMono = GeistMono; // If using GeistMono, it would also be an object.

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
    // Use GeistSans.variable directly. This string (e.g., '--font-geist-sans')
    // is added as a class to the html element, making the CSS variable available.
    <html lang="en" className={GeistSans.variable}>
      <body className={`antialiased font-sans`}> {/* font-sans will use the var from globals.css */}
        <AuthProvider>
          {children}
          <Toaster /> {/* Add Toaster here for global toast notifications */}
        </AuthProvider>
      </body>
    </html>
  );
}
