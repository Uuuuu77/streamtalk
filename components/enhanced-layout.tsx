/**
 * Enhanced App Layout with Integrated Optimizations
 * Main application wrapper that includes all enhancement systems
 */

import React, { useEffect } from 'react';
import { ErrorBoundary, setupGlobalErrorHandling } from '@/components/error-handling';
import { SkipLinks } from '@/components/accessibility';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toast';

// Provider Components
interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // Setup global error handling on app initialization
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <SkipLinks />
        {children}
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// Enhanced Root Layout
interface RootLayoutProps {
  children: React.ReactNode;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="description" content="StreamTalk - Real-time audio conversations where your audience can request to speak and join the discussion" />
        
        {/* Accessibility Meta Tags */}
        <meta name="color-scheme" content="dark" />
        
        {/* Performance Optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Security Headers via Meta Tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        <title>StreamTalk - Interactive Audio Streaming Platform</title>
      </head>
      
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-sans antialiased">
        <AppProviders>
          <div id="root" role="application" aria-label="StreamTalk Application">
            <main id="main-content" role="main" tabIndex={-1}>
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
};

export default { AppProviders, RootLayout };