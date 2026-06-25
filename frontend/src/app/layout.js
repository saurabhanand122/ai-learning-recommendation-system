import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import './globals.css';

export const metadata = {
  title: 'Learning Path Recommendation System',
  description: 'Modern AI-powered course advisory and learning path recommendation system.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PathCraft',
  },
};

export default function RootLayout({ children }) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkEnabled = clerkKey && !clerkKey.includes('placeholder');

  const bodyContent = (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );

  return (
    <html lang="en">
      <head>
        <title>Learning Path Recommendation System</title>
        <meta name="description" content="AI-powered course advisor for personalized academic roadmaps." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PathCraft" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body>
        {isClerkEnabled ? (
          <ClerkProvider publishableKey={clerkKey}>
            {bodyContent}
          </ClerkProvider>
        ) : (
          bodyContent
        )}
      </body>
    </html>
  );
}
