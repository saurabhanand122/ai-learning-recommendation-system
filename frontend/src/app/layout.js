import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import './globals.css';

export const metadata = {
  title: 'Learning Path Recommendation System',
  description: 'Modern AI-powered course advisory and learning path recommendation system.',
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
