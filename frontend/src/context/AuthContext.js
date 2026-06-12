'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/nextjs';

const AuthContext = createContext({
  isSignedIn: false,
  user: null,
  role: 'student', // student, admin, pod
  token: 'mock-token-abc',
  isMock: true,
  setMockRole: () => {},
  logout: () => {}
});

function MockAuthImpl({ children }) {
  const [role, setRole] = useState('student');
  const [user, setUser] = useState({
    id: 'user_mock_student_1',
    name: 'John Doe',
    email: 'student@example.com',
    role: 'student'
  });

  useEffect(() => {
    const savedRole = localStorage.getItem('mock_role') || 'student';
    handleRoleChange(savedRole);
  }, []);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem('mock_role', newRole);
    
    if (newRole === 'admin') {
      setUser({
        id: 'user_mock_admin_1',
        name: 'Alex Admin',
        email: 'admin@example.com',
        role: 'admin'
      });
    } else if (newRole === 'pod') {
      setUser({
        id: 'user_mock_pod_1',
        name: 'Sarah POD',
        email: 'pod@example.com',
        role: 'pod'
      });
    } else {
      setUser({
        id: 'user_mock_student_1',
        name: 'John Doe',
        email: 'student@example.com',
        role: 'student'
      });
    }
  };

  const logout = () => {
    console.log('Mock logged out');
  };

  return (
    <AuthContext.Provider value={{
      isSignedIn: true,
      user,
      role,
      token: 'mock-jwt-token-xyz',
      isMock: true,
      setMockRole: handleRoleChange,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function ClerkAuthImpl({ children }) {
  const { isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [token, setToken] = useState('');
  const [role, setRole] = useState('student');

  useEffect(() => {
    let interval;
    if (isSignedIn) {
      const refreshToken = async () => {
        try {
          const t = await getToken();
          setToken(t || '');
        } catch (err) {
          console.error('Failed to refresh Clerk token:', err);
        }
      };
      refreshToken();
      // Clerk session tokens expire in 60s, refresh every 45s to keep it alive
      interval = setInterval(refreshToken, 45000);
    } else {
      setToken('');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (user) {
      // Extract role from Clerk public metadata
      setRole(user.publicMetadata?.role || 'student');
    }
  }, [user]);

  const activeUser = user ? {
    id: userId,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    email: user.emailAddresses[0]?.emailAddress || '',
    role: role
  } : null;

  return (
    <AuthContext.Provider value={{
      isSignedIn: !!isSignedIn,
      user: activeUser,
      role,
      token,
      isMock: false,
      setMockRole: () => console.warn('Cannot change role manually when Clerk is active.'),
      logout: () => signOut()
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Global Auth Provider that switches implementation based on environment configuration
export function AuthProvider({ children }) {
  const [clerkEnabled, setClerkEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect if publishable key is set
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (key && !key.includes('placeholder')) {
      setClerkEnabled(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#fff',
        fontFamily: 'sans-serif'
      }}>
        Loading Recommender System...
      </div>
    );
  }

  return clerkEnabled ? (
    <ClerkAuthImpl>{children}</ClerkAuthImpl>
  ) : (
    <MockAuthImpl>{children}</MockAuthImpl>
  );
}

export const useSessionAuth = () => useContext(AuthContext);
export default AuthContext;
