'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  mode?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthForm({ mode = 'signin', onClose, onSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const { signIn, signUp, sendEmailVerification } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: 'Error',
            description: 'Passwords do not match',
            variant: 'destructive'
          });
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: 'Error',
            description: 'Password must be at least 6 characters long',
            variant: 'destructive'
          });
          return;
        }

        await signUp(formData.email, formData.password, formData.displayName);
        
        // Send verification email
        await sendEmailVerification();
        
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account before signing in.',
          variant: 'default'
        });
        
        onClose();
      } else {
        await signIn(formData.email, formData.password);
        
        // Wait a moment for auth state to update
        setTimeout(() => {
          toast({
            title: 'Welcome back! 🎉',
            description: 'You have successfully signed in and can now create or join sessions.',
            variant: 'default'
          });
          onSuccess?.();
          onClose();
        }, 500);
      }
    } catch (error: any) {
      toast({
        title: 'Authentication Error',
        description: error.message || 'An error occurred during authentication',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Display Name"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-500"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="pl-10 border-purple-200 focus:border-purple-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="pl-10 pr-10 border-purple-200 focus:border-purple-500"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {mode === 'signup' && (
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-500"
                required
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <Button
            variant="link"
            onClick={() => window.location.reload()}
            className="text-purple-600 hover:text-purple-700 p-0"
          >
            {mode === 'signin' ? 'Create one here' : 'Sign in instead'}
          </Button>
        </div>
      </Card>
    </div>
  );
}