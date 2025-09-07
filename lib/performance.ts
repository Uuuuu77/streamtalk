/**/**/**

 * Performance Optimization Utilities

 * Code splitting, lazy loading, memoization, and bundle optimization * Performance Optimization Utilities * Performance Optimization Utilities

 */

 * Code splitting, lazy loading, memoization, and bundle optimization * Code splitting, lazy loading, memoization, and bundle optimization

import React, { useMemo, useCallback, useRef, useEffect } from 'react';

import dynamic from 'next/dynamic'; */ */

import { ComponentSkeletons } from '@/components/loading-skeletons';



// Dynamic imports with optimized loading

export const DynamicComponents = {import React, { useMemo, useCallback, useRef, useEffect } from 'react';import React, { useMemo, useCallback, useRef, useEffect } from 'react';

  // Heavy components that should be code-split

  Dashboard: dynamic(() => import('@/components/Dashboard'), {import dynamic from 'next/dynamic';import dynamic from 'next/dynamic';

    loading: ComponentSkeletons.Dashboard,

    ssr: falseimport { ComponentSkeletons } from '@/components/loading-skeletons';import { ComponentSkeletons } from '@/components/loading-skeletons';

  }),



  AuthForm: dynamic(() => import('@/components/auth/AuthForm').then(mod => ({ default: mod.default })), {

    loading: ComponentSkeletons.Dashboard,// Dynamic imports with optimized loading// Dynamic imports with optimized loading

    ssr: true

  })export const DynamicComponents = {export const DynamicComponents = {

} as const;

  // Heavy components that should be code-split  // Heavy components that should be code-split

// React performance optimization hooks

export const useOptimizedCallback = <T extends (...args: any[]) => any>(  Dashboard: dynamic(() => import('@/components/Dashboard'), {  Dashboard: dynamic(() => import('@/components/Dashboard'), {

  callback: T,

  deps: React.DependencyList    loading: ComponentSkeletons.Dashboard,    loading: ComponentSkeletons.Dashboard,

): T => {

  return useCallback(callback, deps);    ssr: false // Disable SSR for dashboard since it requires authentication    ssr: false // Disable SSR for dashboard since it requires authentication

};

  }),  }),

export const useOptimizedMemo = <T>(

  factory: () => T,

  deps: React.DependencyList

): T => {  AuthForm: dynamic(() => import('@/components/auth/AuthForm').then(mod => ({ default: mod.default })), {  AuthForm: dynamic(() => import('@/components/auth/AuthForm').then(mod => ({ default: mod.default })), {

  return useMemo(factory, deps);

};    loading: ComponentSkeletons.Dashboard,    loading: ComponentSkeletons.Dashboard,



// Debounced value hook for performance    ssr: true // Auth forms can be SSR'd    ssr: true // Auth forms can be SSR'd

export const useDebounce = <T>(value: T, delay: number): T => {

  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);  })  })



  useEffect(() => {} as const;} as const;

    const handler = setTimeout(() => {

      setDebouncedValue(value);

    }, delay);

// React performance optimization hooks// React performance optimization hooks

    return () => {

      clearTimeout(handler);export const useOptimizedCallback = <T extends (...args: any[]) => any>(export const useOptimizedCallback = <T extends (...args: any[]) => any>(

    };

  }, [value, delay]);  callback: T,  callback: T,



  return debouncedValue;  deps: React.DependencyList  deps: React.DependencyList

};

): T => {): T => {

// WebRTC Performance Optimizations

export const WebRTCOptimizations = {  return useCallback(callback, deps);  return useCallback(callback, deps);

  getOptimizedRTCConfig: (): RTCConfiguration => ({

    iceServers: [};};

      { urls: 'stun:stun.l.google.com:19302' },

      { urls: 'stun:stun1.l.google.com:19302' }

    ],

    iceCandidatePoolSize: 10,export const useOptimizedMemo = <T>(export const useOptimizedMemo = <T>(

    bundlePolicy: 'max-bundle',

    rtcpMuxPolicy: 'require',  factory: () => T,  factory: () => T,

    iceTransportPolicy: 'all'

  }),  deps: React.DependencyList  deps: React.DependencyList | undefined



  getAdaptiveAudioConstraints: (): MediaStreamConstraints => ({): T => {): T => {

    audio: {

      echoCancellation: true,  return useMemo(factory, deps);  return useMemo(factory, deps);

      noiseSuppression: true,

      autoGainControl: true,};};

      sampleRate: { ideal: 48000, min: 16000 },

      channelCount: { ideal: 1, max: 2 }

    },

    video: false// Debounced value hook for performance// Debounced value hook for performance

  })

} as const;export const useDebounce = <T>(value: T, delay: number): T => {export const useDebounce = <T>(value: T, delay: number): T => {

  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);



  useEffect(() => {  useEffect(() => {

    const handler = setTimeout(() => {    const handler = setTimeout(() => {

      setDebouncedValue(value);      setDebouncedValue(value);

    }, delay);    }, delay);



    return () => {    return () => {

      clearTimeout(handler);      clearTimeout(handler);

    };    };

  }, [value, delay]);  }, [value, delay]);



  return debouncedValue;  return debouncedValue;

};};



// Throttled callback hook// Throttled callback hook

export const useThrottle = <T extends (...args: any[]) => any>(export const useThrottle = <T extends (...args: any[]) => any>(

  callback: T,  callback: T,

  delay: number  delay: number

): T => {): T => {

  const lastCall = useRef<number>(0);  const lastCall = useRef<number>(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  return useCallback((...args: Parameters<T>) => {  return useCallback((...args: Parameters<T>) => {

    const now = Date.now();    const now = Date.now();

        

    if (now - lastCall.current >= delay) {    if (now - lastCall.current >= delay) {

      lastCall.current = now;      lastCall.current = now;

      return callback(...args);      return callback(...args);

    } else {    } else {

      if (timeoutRef.current) {      if (timeoutRef.current) {

        clearTimeout(timeoutRef.current);        clearTimeout(timeoutRef.current);

      }      }

            timeoutRef.current = setTimeout(() => {

      timeoutRef.current = setTimeout(() => {        lastCall.current = Date.now();

        lastCall.current = Date.now();        callback(...args);

        callback(...args);      }, delay - (now - lastCall.current));

      }, delay - (now - lastCall.current));    }

    }  }, [callback, delay]) as T;

  } as T, [callback, delay]);};

};

// Virtual scrolling for large lists

// WebRTC Performance Optimizationsexport const useVirtualList = <T>(

export const WebRTCOptimizations = {  items: T[],

  // Optimized RTC configuration for better performance  itemHeight: number,

  getOptimizedRTCConfig: (): RTCConfiguration => ({  containerHeight: number

    iceServers: [) => {

      { urls: 'stun:stun.l.google.com:19302' },  const [scrollTop, setScrollTop] = React.useState(0);

      { urls: 'stun:stun1.l.google.com:19302' }

    ],  const visibleItems = useMemo(() => {

    iceCandidatePoolSize: 10,    const startIndex = Math.floor(scrollTop / itemHeight);

    bundlePolicy: 'max-bundle',    const endIndex = Math.min(

    rtcpMuxPolicy: 'require',      startIndex + Math.ceil(containerHeight / itemHeight) + 1,

    iceTransportPolicy: 'all'      items.length

  }),    );



  // Adaptive audio constraints based on device capabilities    return {

  getAdaptiveAudioConstraints: (): MediaStreamConstraints => ({      startIndex,

    audio: {      endIndex,

      echoCancellation: true,      visibleItems: items.slice(startIndex, endIndex),

      noiseSuppression: true,      totalHeight: items.length * itemHeight,

      autoGainControl: true,      offsetY: startIndex * itemHeight

      sampleRate: { ideal: 48000, min: 16000 },    };

      channelCount: { ideal: 1, max: 2 },  }, [items, itemHeight, containerHeight, scrollTop]);

      // Adaptive bitrate based on connection

      ...(navigator.connection && (navigator.connection as any).effectiveType === '4g'   return {

        ? { sampleSize: 16 }     ...visibleItems,

        : { sampleSize: 8 })    setScrollTop

    },  };

    video: false};

  })

} as const;// Intersection Observer hook for lazy loading

export const useIntersectionObserver = (

// Cache management utilities  ref: React.RefObject<Element>,

export const CacheOptimizations = {  options: IntersectionObserverInit = {}

  // LRU Cache implementation for frequently accessed data) => {

  createLRUCache: <T>(maxSize: number) => {  const [isIntersecting, setIsIntersecting] = React.useState(false);

    const cache = new Map<string, T>();

      useEffect(() => {

    return {    const element = ref.current;

      get: (key: string): T | undefined => {    if (!element) return;

        if (cache.has(key)) {

          const value = cache.get(key)!;    const observer = new IntersectionObserver(

          cache.delete(key);      ([entry]) => setIsIntersecting(entry.isIntersecting),

          cache.set(key, value);      options

          return value;    );

        }

        return undefined;    observer.observe(element);

      },    return () => observer.unobserve(element);

        }, [ref, options]);

      set: (key: string, value: T): void => {

        if (cache.has(key)) {  return isIntersecting;

          cache.delete(key);};

        } else if (cache.size >= maxSize) {

          const firstKey = cache.keys().next().value;// Optimized component wrapper with memoization

          cache.delete(firstKey);export const withPerformanceOptimization = <P extends object>(

        }  Component: React.ComponentType<P>,

        cache.set(key, value);  areEqual?: (prevProps: P, nextProps: P) => boolean

      },) => {

        const OptimizedComponent = memo(Component, areEqual);

      clear: (): void => {  OptimizedComponent.displayName = `Optimized(${Component.displayName || Component.name})`;

        cache.clear();  return OptimizedComponent;

      },};

      

      size: (): number => cache.size// Bundle size analysis helper (development only)

    };export const BundleAnalyzer = {

  }  logComponentSize: (componentName: string, component: any) => {

} as const;    if (process.env.NODE_ENV === 'development') {
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