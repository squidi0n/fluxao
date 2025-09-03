/**
 * Accessibility utilities for WCAG AA compliance
 */

/**
 * Calculate relative luminance of a color
 * @param rgb RGB color values [r, g, b] in 0-255 range
 * @returns Relative luminance value
 */
export function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 RGB color values [r, g, b]
 * @param color2 RGB color values [r, g, b]
 * @returns Contrast ratio
 */
export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number],
): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio Contrast ratio
 * @param largeText Whether the text is large (18pt+ or 14pt+ bold)
 * @returns Whether the contrast meets WCAG AA
 */
export function meetsWCAGAA(ratio: number, largeText = false): boolean {
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 * @param ratio Contrast ratio
 * @param largeText Whether the text is large
 * @returns Whether the contrast meets WCAG AAA
 */
export function meetsWCAGAAA(ratio: number, largeText = false): boolean {
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Convert hex color to RGB
 * @param hex Hex color code
 * @returns RGB values [r, g, b]
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

/**
 * Generate accessible focus styles
 */
export const focusStyles = {
  // Visible focus indicator for keyboard navigation
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',

  // High contrast focus for better visibility
  highContrast:
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',

  // Focus within for form groups
  within: 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
};

/**
 * Screen reader only class
 * Visually hides element but keeps it accessible to screen readers
 */
export const srOnly = 'sr-only';

/**
 * Not screen reader only - shows element only to screen readers
 */
export const notSrOnly = 'not-sr-only';

/**
 * Skip to main content link styles
 */
export const skipToMain =
  'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg';

/**
 * Announce to screen readers using aria-live
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', srOnly);
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within an element (useful for modals)
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])',
  );

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    const isTabPressed = e.key === 'Tab';

    if (!isTabPressed) return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  firstFocusableElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Debounce function for reducing motion
 */
export function respectMotionPreference() {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * ARIA attributes for common patterns
 */
export const ariaPatterns = {
  // Loading state
  loading: {
    'aria-busy': 'true',
    'aria-live': 'polite',
  },

  // Error state
  error: {
    role: 'alert',
    'aria-live': 'assertive',
  },

  // Success state
  success: {
    role: 'status',
    'aria-live': 'polite',
  },

  // Navigation
  navigation: {
    role: 'navigation',
    'aria-label': 'Main navigation',
  },

  // Search
  search: {
    role: 'search',
    'aria-label': 'Search',
  },

  // Modal
  modal: {
    role: 'dialog',
    'aria-modal': 'true',
  },

  // Tabs
  tablist: {
    role: 'tablist',
  },
  tab: {
    role: 'tab',
    'aria-selected': 'false',
    tabindex: '-1',
  },
  tabpanel: {
    role: 'tabpanel',
    tabindex: '0',
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboardNav = {
  // Arrow key codes
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  Tab: 'Tab',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
};

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Get accessible color based on background
 */
export function getAccessibleTextColor(backgroundColor: [number, number, number]): string {
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];

  const whiteContrast = getContrastRatio(backgroundColor, white);
  const blackContrast = getContrastRatio(backgroundColor, black);

  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Format text for screen readers
 */
export function formatForScreenReader(text: string): string {
  // Add spaces between camelCase words
  return (
    text
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Add spaces between numbers and letters
      .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
      .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
      // Convert to lowercase
      .toLowerCase()
  );
}

/**
 * Live region for dynamic content updates
 */
export class LiveRegion {
  private element: HTMLElement;

  constructor(priority: 'polite' | 'assertive' = 'polite') {
    this.element = document.createElement('div');
    this.element.setAttribute('aria-live', priority);
    this.element.setAttribute('aria-atomic', 'true');
    this.element.className = srOnly;
    document.body.appendChild(this.element);
  }

  announce(message: string) {
    this.element.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      this.element.textContent = '';
    }, 1000);
  }

  destroy() {
    document.body.removeChild(this.element);
  }
}
