import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

export const useAutoLogout = () => {
  const [, navigate] = useLocation();
  const lastActivityRef = useRef<number>(Date.now());
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    // Clear auth token
    localStorage.removeItem('authToken');
    
    // Clear all application storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Redirect to landing page
    navigate('/');
  };

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  const checkForTimeout = () => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    
    if (timeSinceLastActivity >= TIMEOUT_DURATION) {
      console.log('Auto-logout triggered due to inactivity');
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