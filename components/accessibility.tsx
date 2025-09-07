/**
 * Comprehensive Accessibility Enhancements
 * WCAG 2.1 AA compliant components and utilities
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { designColors } from '@/lib/design-system';

// Skip Links Component for screen readers
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus:not-sr-only fixed top-0 left-0 z-50 bg-purple-600 text-white p-2 m-2 rounded">
      <a 
        href="#main-content" 
        className="skip-link text-white hover:text-purple-200 underline mr-4"
        onFocus={(e) => e.currentTarget.parentElement?.classList.remove('sr-only')}
        onBlur={(e) => e.currentTarget.parentElement?.classList.add('sr-only')}
      >
        Skip to main content
      </a>
      <a 
        href="#navigation" 
        className="skip-link text-white hover:text-purple-200 underline mr-4"
        onFocus={(e) => e.currentTarget.parentElement?.classList.remove('sr-only')}
        onBlur={(e) => e.currentTarget.parentElement?.classList.add('sr-only')}
      >
        Skip to navigation
      </a>
      <a 
        href="#queue" 
        className="skip-link text-white hover:text-purple-200 underline"
        onFocus={(e) => e.currentTarget.parentElement?.classList.remove('sr-only')}
        onBlur={(e) => e.currentTarget.parentElement?.classList.add('sr-only')}
      >
        Skip to queue
      </a>
    </div>
  );
};

// Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tooltip?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  ariaLabel,
  ariaDescribedBy,
  tooltip,
  onClick,
  disabled,
  className = '',
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    onClick?.(e);
  }, [disabled, isLoading, onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsPressed(true);
      if (!disabled && !isLoading) {
        onClick?.(e as any);
      }
    }
  }, [disabled, isLoading, onClick]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setIsPressed(false);
    }
  }, []);

  // Touch target validation (minimum 44x44px)
  const sizeClasses = {
    sm: 'min-h-[44px] px-3 py-2 text-sm',
    md: 'min-h-[44px] px-4 py-3 text-base',
    lg: 'min-h-[48px] px-6 py-3 text-lg',
    xl: 'min-h-[56px] px-8 py-4 text-xl'
  };

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white border-2 border-purple-600 hover:border-purple-700',
    secondary: 'bg-slate-700 hover:bg-slate-600 focus:bg-slate-600 text-white border-2 border-slate-700 hover:border-slate-600',
    outline: 'bg-transparent hover:bg-purple-50 focus:bg-purple-50 text-purple-600 border-2 border-purple-600 hover:border-purple-700',
    ghost: 'bg-transparent hover:bg-slate-100 focus:bg-slate-100 text-slate-700 border-2 border-transparent',
    destructive: 'bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white border-2 border-red-600 hover:border-red-700'
  };

  const buttonClasses = `
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${isPressed ? 'transform scale-95' : ''}
    ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900
    active:transform active:scale-95
    ${className}
  `.trim();

  return (
    <button
      ref={buttonRef}
      className={buttonClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={disabled || isLoading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-pressed={isPressed}
      aria-disabled={disabled || isLoading}
      title={tooltip}
      role="button"
      tabIndex={0}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="mr-2" aria-hidden="true">{icon}</span>
      )}
      
      <span>
        {isLoading ? (loadingText || 'Loading...') : children}
      </span>
      
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="ml-2" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
};

// Accessible Input Component
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  showRequiredIndicator = true,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${React.useId()}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ');

  return (
    <div className="space-y-2">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-white"
      >
        {label}
        {required && showRequiredIndicator && (
          <span className="text-red-400 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      <input
        id={inputId}
        className={`
          w-full min-h-[44px] px-4 py-3
          bg-slate-900 border-2 text-white placeholder:text-gray-500
          rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900
          ${error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-slate-600 focus:border-purple-500 hover:border-slate-500'
          }
          ${className}
        `.trim()}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-400">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Live Region for dynamic announcements
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}> = ({ children, politeness = 'polite', atomic = true }) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
};

// Focus management hook
export const useFocusManagement = () => {
  const focusElementRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    focusElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusElementRef.current && focusElementRef.current.focus) {
      focusElementRef.current.focus();
    }
  }, []);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    trapFocus
  };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  items: Array<{ id: string; element?: HTMLElement }>,
  onSelect?: (id: string) => void
) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setCurrentIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Home':
        e.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onSelect && items[currentIndex]) {
          onSelect(items[currentIndex].id);
        }
        break;
    }
  }, [items, currentIndex, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { currentIndex, setCurrentIndex };
};

// High contrast mode detection
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      const isWindows = navigator.platform.indexOf('Win') > -1;
      if (isWindows && window.matchMedia) {
        const highContrastQuery = window.matchMedia('(-ms-high-contrast: active)');
        setIsHighContrast(highContrastQuery.matches);
        
        const handleChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
        highContrastQuery.addEventListener('change', handleChange);
        
        return () => highContrastQuery.removeEventListener('change', handleChange);
      }
    };

    checkHighContrast();
  }, []);

  return isHighContrast;
};

// Reduced motion preference detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Accessible Modal Component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { saveFocus, restoreFocus, focusFirst, trapFocus } = useFocusManagement();

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      setTimeout(() => {
        if (modalRef.current) {
          focusFirst(modalRef.current);
          const cleanup = trapFocus(modalRef.current);
          return cleanup;
        }
      }, 100);
    } else {
      restoreFocus();
    }
  }, [isOpen, saveFocus, restoreFocus, focusFirst, trapFocus]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative w-full ${sizeClasses[size]}
            bg-slate-800 border border-slate-700 rounded-lg shadow-xl
            transform transition-all duration-200
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 id="modal-title" className="text-xl font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 rounded p-1"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Accessible Toast/Notification Component
interface AccessibleToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isVisible: boolean;
  onDismiss: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const AccessibleToast: React.FC<AccessibleToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onDismiss,
  autoClose = true,
  duration = 5000
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onDismiss]);

  if (!isVisible) return null;

  const typeStyles = {
    info: 'bg-blue-600 border-blue-500',
    success: 'bg-green-600 border-green-500',
    warning: 'bg-yellow-600 border-yellow-500',
    error: 'bg-red-600 border-red-500'
  };

  const typeIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        ${typeStyles[type]}
        border-l-4 text-white p-4 rounded-lg shadow-lg
        max-w-sm w-full
        transform transition-all duration-300
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start">
        <span className="mr-2" aria-hidden="true">
          {typeIcons[type]}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Screen reader utility
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

export default {
  SkipLinks,
  AccessibleButton,
  AccessibleInput,
  LiveRegion,
  AccessibleModal,
  AccessibleToast,
  ScreenReaderOnly,
  useFocusManagement,
  useKeyboardNavigation,
  useHighContrastMode,
  useReducedMotion
};