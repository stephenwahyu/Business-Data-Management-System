import { useCallback, useRef } from 'react';

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param {Function} callback The function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @param {boolean} [immediate=false] Whether to invoke the function on the leading edge instead of the trailing edge
 * @returns {Function} The debounced function
 */
export function useDebouncedCallback(callback, wait = 300, immediate = false) {
  // Use a ref to store the timeout ID
  const timeoutRef = useRef(null);
  
  // Create a memoized debounced callback
  return useCallback((...args) => {
    // Store the current callback context
    const context = this;
    
    // Function to execute after the delay
    const later = () => {
      timeoutRef.current = null;
      if (!immediate) {
        callback.apply(context, args);
      }
    };
    
    // Determine if we should invoke immediately (on leading edge)
    const callNow = immediate && !timeoutRef.current;
    
    // Clear the current timeout if one exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout
    timeoutRef.current = setTimeout(later, wait);
    
    // If we're on the leading edge, invoke the function now
    if (callNow) {
      callback.apply(context, args);
    }
  }, [callback, wait, immediate]);
}

export default useDebouncedCallback;