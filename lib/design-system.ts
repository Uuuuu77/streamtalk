/**
 * StreamTalk Design System
 * Comprehensive design tokens and utility functions for consistent UI/UX
 */

// Color Palette - Consistent across the application
export const colors = {
  // Primary Purple Shades
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa', // Primary accent
    500: '#8b5cf6', // Main brand
    600: '#7c3aed', // Primary interactive
    700: '#6d28d9',
    800: '#5b21b7',
    900: '#4c1d95'
  },
  
  // Secondary Slate Shades
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b', // Dark backgrounds
    900: '#0f172a'  // Darkest background
  },
  
  // Accent Colors
  accent: {
    blue: {
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb'
    },
    green: {
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a'
    },
    yellow: {
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04'
    },
    red: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
    orange: {
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c'
    }
  },
  
  // Semantic Colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  }
} as const;

// Typography System
export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace']
  },
  
  // Font Sizes with responsive considerations
  fontSize: {
    xs: { base: '0.75rem', mobile: '0.75rem' },      // 12px
    sm: { base: '0.875rem', mobile: '0.875rem' },    // 14px
    base: { base: '1rem', mobile: '0.95rem' },       // 16px/15px
    lg: { base: '1.125rem', mobile: '1.1rem' },      // 18px/17.6px
    xl: { base: '1.25rem', mobile: '1.2rem' },       // 20px/19.2px
    '2xl': { base: '1.5rem', mobile: '1.4rem' },     // 24px/22.4px
    '3xl': { base: '1.875rem', mobile: '1.7rem' },   // 30px/27.2px
    '4xl': { base: '2.25rem', mobile: '2rem' },      // 36px/32px
    '5xl': { base: '3rem', mobile: '2.5rem' },       // 48px/40px
    '6xl': { base: '3.75rem', mobile: '3rem' }       // 60px/48px
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  
  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
} as const;

// Spacing System (in rem units)
export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem'      // 128px
} as const;

// Border Radius System
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
} as const;

// Shadow System
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 20px rgb(139 92 246 / 0.3)' // Purple glow
} as const;

// Responsive Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Touch Target Sizes (minimum 44x44px for accessibility)
export const touchTargets = {
  sm: '40px',
  md: '44px',   // Minimum recommended
  lg: '48px',
  xl: '56px'
} as const;

// Component Variants
export const componentVariants = {
  button: {
    sizes: {
      sm: {
        height: touchTargets.sm,
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSize.sm.base
      },
      md: {
        height: touchTargets.md,
        padding: `${spacing[3]} ${spacing[4]}`,
        fontSize: typography.fontSize.base.base
      },
      lg: {
        height: touchTargets.lg,
        padding: `${spacing[3]} ${spacing[6]}`,
        fontSize: typography.fontSize.lg.base
      },
      xl: {
        height: touchTargets.xl,
        padding: `${spacing[4]} ${spacing[8]}`,
        fontSize: typography.fontSize.xl.base
      }
    },
    variants: {
      primary: {
        backgroundColor: colors.primary[600],
        color: 'white',
        hover: colors.primary[700],
        focus: colors.primary[500]
      },
      secondary: {
        backgroundColor: colors.secondary[700],
        color: 'white',
        hover: colors.secondary[600],
        focus: colors.secondary[500]
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: colors.primary[400],
        color: colors.primary[400],
        hover: `${colors.primary[400]}1a`, // 10% opacity
        focus: colors.primary[300]
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.secondary[300],
        hover: colors.secondary[800],
        focus: colors.secondary[700]
      },
      destructive: {
        backgroundColor: colors.accent.red[600],
        color: 'white',
        hover: colors.accent.red[700],
        focus: colors.accent.red[500]
      }
    }
  },
  
  card: {
    base: {
      backgroundColor: `${colors.secondary[800]}80`, // 50% opacity
      borderColor: colors.secondary[700],
      borderRadius: borderRadius.lg,
      padding: spacing[6]
    },
    hover: {
      borderColor: `${colors.primary[500]}80` // 50% opacity
    }
  },
  
  input: {
    base: {
      backgroundColor: colors.secondary[900],
      borderColor: colors.secondary[600],
      color: 'white',
      borderRadius: borderRadius.lg,
      padding: `${spacing[3]} ${spacing[4]}`,
      minHeight: touchTargets.md
    },
    focus: {
      borderColor: colors.primary[500],
      outline: `2px solid ${colors.primary[500]}40` // 25% opacity
    },
    error: {
      borderColor: colors.accent.red[500]
    }
  }
} as const;

// Animation Durations
export const animations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms'
} as const;

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  tooltip: 50
} as const;

// Utility Functions
export const designSystem = {
  /**
   * Get responsive font size CSS
   */
  responsiveFontSize: (size: keyof typeof typography.fontSize) => {
    const { base, mobile } = typography.fontSize[size];
    return {
      fontSize: mobile,
      '@media (min-width: 640px)': {
        fontSize: base
      }
    };
  },
  
  /**
   * Get color with opacity
   */
  colorWithOpacity: (color: string, opacity: number) => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  },
  
  /**
   * Get responsive spacing
   */
  responsiveSpacing: (mobile: keyof typeof spacing, desktop?: keyof typeof spacing) => {
    return {
      padding: spacing[mobile],
      '@media (min-width: 640px)': {
        padding: spacing[desktop || mobile]
      }
    };
  },
  
  /**
   * Generate consistent focus styles
   */
  focusStyles: {
    outline: `2px solid ${colors.primary[500]}`,
    outlineOffset: '2px'
  },
  
  /**
   * Generate hover transition
   */
  hoverTransition: {
    transition: `all ${animations.normal} ease-in-out`
  }
} as const;

// Export individual modules for tree-shaking
export { colors as designColors };
export { typography as designTypography };
export { spacing as designSpacing };
export { borderRadius as designBorderRadius };
export { shadows as designShadows };
export { breakpoints as designBreakpoints };
export { componentVariants as designComponents };
export { animations as designAnimations };

// Default export
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  touchTargets,
  componentVariants,
  animations,
  zIndex,
  ...designSystem
};