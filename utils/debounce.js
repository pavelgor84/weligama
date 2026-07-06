/**
 * Debounce Utility Functions for Weligama Project
 * 
 * Purpose: Reduce excessive function calls during rapid user interactions
 * (scrolling, map movements, zooming) to improve performance and reduce state updates.
 */

/**
 * Classic debounce utility
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds (default: 200ms)
 * @returns {Function} Debounced function wrapper
 * 
 * Usage: const debouncedFunc = debounce(func, 300); debouncedFunc(arg1, arg2);
 */
export const debounce = (func, wait = 200) => {
    let timeout;
    
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

/**
 * Throttle utility - limits function calls to once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in ms (default: 100ms)
 * @returns {Function} Throttled function wrapper
 * 
 * Usage: const throttledFunc = throttle(func, 200); throttledFunc(arg1, arg2);
 */
export const throttle = (func, limit = 100) => {
    let inThrottle;
    
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
};

/**
 * UseEffect hook wrapper for debounced effects
 * @param {Function} effect - Effect function
 * @param {number} delay - Debounce delay (default: 200ms)
 */
export const useDebounce = (effect, delay = 200) => {
    useEffect(() => {
        let timeout;
        
        // Set up debounce
        timeout = setTimeout(() => {
            effect();
        }, delay);
        
        // Cleanup on unmount or dependency change
        return () => {
            clearTimeout(timeout);
        };
    }, [effect, delay]);
};

/**
 * React hook for debouncing function calls
 * @param {Function} callback - Function to debounce
 * @param {number} wait - Delay in ms (default: 200ms)
 */
export const useDebounceFunction = (callback, wait = 200) => {
    useEffect(() => {
        let timeout;
        
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                callback(...args);
            }, wait);
        };
    }, [callback, wait]);
};

/**
 * Lodash-style debounceWithLeadingAndTrailing
 * Calls function on first invocation, then throttles to delay between calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in ms (default: 300ms)
 */
export const debounceWithLeadingAndTrailing = (func, wait = 300) => {
    let timeout;
    
    return (...args) => {
        clearTimeout(timeout);
        
        // Call immediately on first call
        func(...args);
        
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

/**
 * Leading debounce - calls function before throttling starts
 */
export const leadingDebounce = (func, wait = 300) => {
    let inWait;
    
    return (...args) => {
        if (!inWait) {
            func(...args);
            inWait = true;
            
            setTimeout(() => {
                inWait = false;
            }, wait);
        }
    };
};

/**
 * Trailing debounce - waits for interval to pass before calling
 */
export const trailingDebounce = (func, wait = 300) => {
    let timeout;
    
    return (...args) => {
        clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
};
