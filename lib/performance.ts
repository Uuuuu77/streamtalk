/**
 * Performance Optimization Utilities
 * Code splitting, lazy loading, memoization, and bundle optimization
 */

import React, { Suspense, lazy, memo, useMemo, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Loading skeleton components for better UX during code splitting
export const ComponentSkeletons = {
  Dashboard: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="h-6 bg-slate-600 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-600 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-slate-600 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),

  StreamerDashboard: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
            <div className="h-10 bg-slate-700 rounded w-24"></div>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="h-6 bg-slate-600 rounded w-1/2 mb-4"></div>
                <div className="h-32 bg-slate-600 rounded"></div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="h-6 bg-slate-600 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-600 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="h-6 bg-slate-600 rounded w-2/3 mb-4"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-slate-600 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  ViewerInterface: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="animate-pulse">
          <div className="text-center mb-8">
            <div className="h-8 bg-slate-700 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-600 rounded w-3/4 mx-auto"></div>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="h-6 bg-slate-600 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-slate-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),

  AuthForm: () => (
    <div className="max-w-md w-full mx-4">
      <div className="animate-pulse">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="h-6 bg-slate-600 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-slate-600 rounded"></div>
            <div className="h-10 bg-slate-600 rounded"></div>
            <div className="h-10 bg-slate-600 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  ),

  Generic: () => (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
    </div>
  )
} as const;

// Dynamic imports with optimized loading
export const DynamicComponents = {
  // Heavy components that should be code-split
  Dashboard: dynamic(() => import('@/components/Dashboard'), {
    loading: ComponentSkeletons.Dashboard,
    ssr: false // Disable SSR for dashboard since it requires authentication
  }),

  StreamerDashboard: dynamic(() => import('@/components/StreamerDashboard'), {
    loading: ComponentSkeletons.StreamerDashboard,
    ssr: false // WebRTC components don't work with SSR
  }),

  ViewerInterface: dynamic(() => import('@/components/ViewerInterface'), {
    loading: ComponentSkeletons.ViewerInterface,
    ssr: false // WebRTC components don't work with SSR
  }),

  AuthForm: dynamic(() => import('@/components/auth/AuthForm'), {
    loading: ComponentSkeletons.AuthForm,
    ssr: true // Auth forms can be SSR'd
  }),

  // Large libraries that should be lazy loaded
  SimplePeer: dynamic(() => import('simple-peer'), {
    loading: ComponentSkeletons.Generic,
    ssr: false
  }),

  // Audio visualizer (heavy canvas operations)
  AudioVisualizer: dynamic(() => import('@/components/AudioVisualizer'), {
    loading: () => <div className="h-20 bg-slate-700 rounded animate-pulse"></div>,
    ssr: false
  }),

  // Settings panels (not immediately needed)
  SessionSettings: dynamic(() => import('@/components/SessionSettings'), {
    loading: ComponentSkeletons.Generic,
    ssr: false
  }),

  // Analytics dashboard (heavy charts)
  Analytics: dynamic(() => import('@/components/Analytics'), {
    loading: ComponentSkeletons.Generic,
    ssr: false
  })
} as const;

// React performance optimization hooks
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T => {
  return useMemo(factory, deps);
};

// Debounced value hook for performance
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]) as T;
};

// Virtual scrolling for large lists
export const useVirtualList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  return {
    ...visibleItems,
    setScrollTop
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [ref, options]);

  return isIntersecting;
};

// Optimized component wrapper with memoization
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  const OptimizedComponent = memo(Component, areEqual);
  OptimizedComponent.displayName = `Optimized(${Component.displayName || Component.name})`;
  return OptimizedComponent;
};

// Bundle size analysis helper (development only)
export const BundleAnalyzer = {
  logComponentSize: (componentName: string, component: any) => {
    if (process.env.NODE_ENV === 'development') {
      // Rough estimation of component size
      const size = JSON.stringify(component).length;
      console.log(`Component ${componentName} estimated size: ${size} bytes`);
    }
  },

  measureRenderTime: <P extends object>(
    Component: React.ComponentType<P>
  ): React.ComponentType<P> => {
    if (process.env.NODE_ENV !== 'development') {
      return Component;
    }

    return (props: P) => {
      const renderStart = performance.now();
      
      useEffect(() => {
        const renderEnd = performance.now();
        console.log(`${Component.displayName || Component.name} render time: ${renderEnd - renderStart}ms`);
      });

      return <Component {...props} />;
    };
  }
} as const;

// WebRTC Performance Optimizations
export const WebRTCOptimizations = {
  // Optimized RTC configuration for better performance
  getOptimizedRTCConfig: (): RTCConfiguration => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all'
  }),

  // Adaptive audio constraints based on device capabilities
  getAdaptiveAudioConstraints: (): MediaStreamConstraints => ({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: { ideal: 48000, min: 16000 },
      channelCount: { ideal: 1, max: 2 },
      // Adaptive bitrate based on connection
      ...(navigator.connection && (navigator.connection as any).effectiveType === '4g' 
        ? { sampleSize: 16 } 
        : { sampleSize: 8 })
    },
    video: false
  }),

  // Connection quality monitoring
  monitorConnectionQuality: (
    peerConnection: RTCPeerConnection,
    onQualityChange: (quality: 'excellent' | 'good' | 'poor') => void
  ) => {
    const interval = setInterval(async () => {
      const stats = await peerConnection.getStats();
      let bytesReceived = 0;
      let packetsLost = 0;
      let jitter = 0;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
          bytesReceived = report.bytesReceived || 0;
          packetsLost = report.packetsLost || 0;
          jitter = report.jitter || 0;
        }
      });

      // Simple quality assessment
      const quality = packetsLost < 5 && jitter < 0.03 
        ? 'excellent' 
        : packetsLost < 15 && jitter < 0.1 
        ? 'good' 
        : 'poor';

      onQualityChange(quality);
    }, 5000);

    return () => clearInterval(interval);
  }
} as const;

// Image optimization utilities
export const ImageOptimizations = {
  // Lazy loading image component
  LazyImage: memo(({ src, alt, className, ...props }: {
    src: string;
    alt: string;
    className?: string;
    [key: string]: any;
  }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const isVisible = useIntersectionObserver(imgRef, { threshold: 0.1 });
    const [loaded, setLoaded] = React.useState(false);

    return (
      <div ref={imgRef} className={`${className} ${loaded ? '' : 'animate-pulse bg-slate-700'}`}>
        {isVisible && (
          <img
            src={src}
            alt={alt}
            onLoad={() => setLoaded(true)}
            className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            {...props}
          />
        )}
      </div>
    );
  }),

  // Generate optimized image URLs (for future CDN integration)
  getOptimizedImageUrl: (url: string, width?: number, quality?: number): string => {
    // This would integrate with a CDN like Cloudinary or similar
    // For now, return the original URL
    return url;
  }
} as const;

export default {
  ComponentSkeletons,
  DynamicComponents,
  useOptimizedCallback,
  useOptimizedMemo,
  useDebounce,
  useThrottle,
  useVirtualList,
  useIntersectionObserver,
  withPerformanceOptimization,
  BundleAnalyzer,
  WebRTCOptimizations,
  ImageOptimizations
};