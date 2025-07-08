import { useEffect, useRef } from 'react';

const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

export const useAutoLogout = () => {
  const lastActivityRef = useRef<number>(Date.now());
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    console.log('Auto-logout triggered due to inactivity');
    
    // Clear auth token
    localStorage.removeItem('authToken');
    
    // Clear all application storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Force redirect to landing page using window.location
    window.location.href = '/';
  };

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  const checkForTimeout = () => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    
    // Only logout if user is actually authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      return; // Already logged out
    }
    
    if (timeSinceLastActivity >= TIMEOUT_DURATION) {
      logout();
    }
  };

  useEffect(() => {
    // List of events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners for activity tracking
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Set up interval to check for timeout
    checkTimeoutRef.current = setInterval(checkForTimeout, CHECK_INTERVAL);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      
      if (checkTimeoutRef.current) {
        clearInterval(checkTimeoutRef.current);
      }
    };
  }, []);

  return { logout };
};