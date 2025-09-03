/**
 * FluxAO Admin Design System
 * Professional, consistent design tokens for the admin interface
 */

export const adminDesignSystem = {
  // Color Palette - Professional & Modern
  colors: {
    // Primary brand colors
    primary: {
      50: 'bg-blue-50',
      100: 'bg-blue-100',
      500: 'bg-blue-500',
      600: 'bg-blue-600',
      700: 'bg-blue-700',
      text: 'text-blue-600',
      textDark: 'text-blue-700',
      border: 'border-blue-200',
      ring: 'ring-blue-500',
    },
    
    // Secondary accent colors
    secondary: {
      50: 'bg-purple-50',
      100: 'bg-purple-100',
      500: 'bg-purple-500',
      600: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },

    // Neutral grays - Primary text and backgrounds
    neutral: {
      50: 'bg-slate-50',
      100: 'bg-slate-100',
      200: 'bg-slate-200',
      300: 'bg-slate-300',
      600: 'bg-slate-600',
      700: 'bg-slate-700',
      800: 'bg-slate-800',
      900: 'bg-slate-900',
      text: {
        primary: 'text-slate-900',
        secondary: 'text-slate-700',
        muted: 'text-slate-600',
        light: 'text-slate-400',
        white: 'text-white',
      },
      border: {
        light: 'border-slate-200',
        medium: 'border-slate-300',
        dark: 'border-slate-700',
      }
    },

    // Status colors
    status: {
      success: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      },
      warning: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      },
      error: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500',
      },
      info: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      }
    }
  },

  // Typography Scale
  typography: {
    // Display & Headers
    display: 'text-4xl font-bold tracking-tight',
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-2xl font-bold tracking-tight',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
    h5: 'text-base font-semibold',
    
    // Body text
    body: {
      large: 'text-lg',
      base: 'text-base',
      small: 'text-sm',
      xs: 'text-xs',
    },
    
    // Weights
    weights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    }
  },

  // Spacing System
  spacing: {
    section: 'space-y-8', // Between major sections
    card: 'space-y-6',    // Between cards
    element: 'space-y-4', // Between related elements
    tight: 'space-y-2',   // Between tightly related items
    padding: {
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    }
  },

  // Border Radius
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  // Shadows
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },

  // Component Variants
  components: {
    // Card styles
    card: {
      base: 'bg-white border border-slate-200 rounded-xl shadow-sm',
      elevated: 'bg-white border-none rounded-xl shadow-lg',
      glass: 'bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm',
      gradient: 'bg-gradient-to-r rounded-xl shadow-sm',
    },

    // Button variants
    button: {
      primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-medium rounded-lg transition-all duration-200',
      secondary: 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium rounded-lg transition-all duration-200',
      ghost: 'hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-all duration-200',
    },

    // Badge styles
    badge: {
      primary: 'bg-blue-100 text-blue-700 border-blue-200 font-semibold',
      success: 'bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold',
      warning: 'bg-amber-100 text-amber-700 border-amber-200 font-semibold',
      error: 'bg-red-100 text-red-700 border-red-200 font-semibold',
      neutral: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
    },

    // Icon containers
    iconContainer: {
      sm: 'w-8 h-8 rounded-lg flex items-center justify-center',
      md: 'w-10 h-10 rounded-xl flex items-center justify-center',
      lg: 'w-12 h-12 rounded-xl flex items-center justify-center',
    },

    // Status indicators
    statusIndicator: {
      online: 'w-3 h-3 bg-emerald-500 rounded-full',
      offline: 'w-3 h-3 bg-red-500 rounded-full',
      warning: 'w-3 h-3 bg-amber-500 rounded-full',
      pulse: 'animate-pulse',
    }
  },

  // Animation & Transitions
  animations: {
    transition: 'transition-all duration-200',
    transitionSlow: 'transition-all duration-300',
    hover: {
      scale: 'hover:scale-105',
      shadow: 'hover:shadow-lg',
      bg: 'hover:bg-slate-50',
    },
    fadeIn: 'animate-fade-in-up',
    pulse: 'animate-pulse',
  },

  // Layout Utilities
  layout: {
    container: 'max-w-7xl mx-auto',
    grid: {
      cols1: 'grid grid-cols-1',
      cols2: 'grid grid-cols-1 md:grid-cols-2',
      cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
    },
    flex: {
      between: 'flex items-center justify-between',
      center: 'flex items-center justify-center',
      start: 'flex items-center',
      col: 'flex flex-col',
    }
  }
};

// Helper function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Common component combinations
export const adminComponents = {
  // Standard metric card
  metricCard: (colorScheme: 'blue' | 'emerald' | 'purple' | 'amber') => {
    const colors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
      emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
    };
    return cn(
      adminDesignSystem.components.card.base,
      colors[colorScheme].bg,
      colors[colorScheme].border,
      'border-2',
      adminDesignSystem.animations.hover.scale,
      adminDesignSystem.animations.hover.shadow,
      adminDesignSystem.animations.transition
    );
  },

  // Alert styles
  alert: (type: 'success' | 'warning' | 'error' | 'info') => cn(
    adminDesignSystem.components.card.base,
    adminDesignSystem.colors.status[type].bg,
    adminDesignSystem.colors.status[type].border,
    'border-l-4'
  ),

  // Section headers
  sectionHeader: cn(
    adminDesignSystem.typography.h3,
    adminDesignSystem.colors.neutral.text.primary
  ),

  // Quick action buttons
  quickAction: cn(
    adminDesignSystem.components.card.base,
    'hover:shadow-lg hover:scale-105',
    adminDesignSystem.animations.transition,
    'cursor-pointer'
  ),
};

export default adminDesignSystem;