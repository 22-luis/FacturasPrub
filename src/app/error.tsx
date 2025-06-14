
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary Caught:", error); // Now uncommented for client-side logging
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Application Error</title>
        {/* Minimal styling can be added here if globals.css isn't loaded */}
      </head>
      <body>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="items-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <CardTitle className="text-2xl text-center font-semibold text-destructive">
                Application Error
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground pt-2">
                An unexpected error occurred. We've logged it and will investigate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && error?.message && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <p className="text-sm font-semibold text-destructive">Error Details (Development Mode):</p>
                  <pre className="mt-1 text-xs text-destructive/80 whitespace-pre-wrap">
                    {error.message}
                  </pre>
                  {error.stack && (
                     <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-destructive/70 hover:text-destructive">Stack Trace</summary>
                        <pre className="mt-1 text-destructive/60 whitespace-pre-wrap overflow-auto max-h-48">
                            {error.stack}
                        </pre>
                     </details>
                  )}
                  {error.digest && (
                    <p className="mt-2 text-xs text-muted-foreground">Digest: {error.digest}</p>
                  )}
                </div>
              )}
              <Button onClick={() => reset()} className="w-full">
                Try to Recover
              </Button>
              <Button variant="outline" onClick={() => {
                if (typeof window !== "undefined") {
                    window.location.href = '/';
                }
              }} className="w-full">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
          <footer className="py-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SnapClaim. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  );
}
