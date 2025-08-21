'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  sendEmailVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // For now, allow unverified users but show a gentle reminder
      if (!result.user.emailVerified) {
        toast({
          title: 'Email Verification Recommended',
          description: 'For full security, please verify your email. Check your inbox for the verification link.',
          variant: 'default'
        });
        // Don't sign out unverified users, just show the reminder
      }
      
      toast({
        title: 'Success',
        description: 'Successfully signed in!',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: 'Sign In Failed',
        description: error.message || 'Failed to sign in',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: displayName
      });
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      toast({
        title: 'Account Created',
        description: 'Account created! Please check your email to verify your account.',
        variant: 'default'
      });
      
      // Sign out user until they verify their email
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: 'Sign Up Failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Success',
        description: 'Successfully signed out!',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign Out Failed',
        description: 'Failed to sign out',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) {
      toast({
        title: 'Error',
        description: 'No user signed in',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: 'Success',
        description: 'Verification email sent!',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Verification email error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send verification email',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    sendEmailVerification: sendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};