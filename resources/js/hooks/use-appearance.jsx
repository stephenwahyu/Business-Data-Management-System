import { useCallback, useEffect, useState } from 'react';

// Helper to check for dark mode preference
const prefersDark = () => {
  // Safe check for browser environment
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Set cookie with same-site attribute for security
const setCookie = (name, value, days = 365) => {
  try {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
  } catch (error) {
    console.error("Failed to set cookie:", error);
  }
};

// Get media query for system theme detection
const getMediaQuery = () => {
  if (typeof window === 'undefined') return null;
  return window.matchMedia('(prefers-color-scheme: dark)');
};

// Apply theme to document
const applyTheme = (appearance) => {
  // Only run in browser environment
  if (typeof document === 'undefined') return;
  
  const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', isDark);
};

// Initialize theme - used during app bootstrap
export function initializeTheme() {
  // Only run in browser environment
  if (typeof localStorage === 'undefined') return;
  
  const saved = localStorage.getItem('appearance') || 'system';
  applyTheme(saved);
}

// React hook for theme management
export function useAppearance() {
  const [appearance, setAppearance] = useState('system');
  
  // Initialize on mount only (client-side)
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedAppearance = localStorage.getItem('appearance') || 'system';
      setAppearance(savedAppearance);
      applyTheme(savedAppearance);
    }
  }, []);

  // Update appearance with proper syncing between localStorage and cookie
  const updateAppearance = useCallback((mode) => {
    if (typeof localStorage === 'undefined') return;
    
    setAppearance(mode);
    localStorage.setItem('appearance', mode);
    setCookie('appearance', mode);
    applyTheme(mode);
  }, []);

  // Set up the system theme change listener
  useEffect(() => {
    const media = getMediaQuery();
    
    // Only listen to system changes when in system mode
    const handleSystemChange = () => {
      if (appearance === 'system') {
        applyTheme('system');
      }
    };

    if (media) {
      media.addEventListener('change', handleSystemChange);
    }

    return () => {
      if (media) {
        media.removeEventListener('change', handleSystemChange);
      }
    };
  }, [appearance]);

  return { appearance, updateAppearance };
}