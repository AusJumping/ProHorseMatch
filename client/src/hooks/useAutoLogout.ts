import { useEffect, useRef } from 'react';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds
const LAST_ACTIVITY_KEY = 'lastActivityTime';

export const useAutoLogout = () => {
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = async () => {
    console.log('Auto-logout triggered due to inactivity');

    // Tell the server to end the session (clears the session cookie)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Continue regardless
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_data');
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    window.location.href = '/auth';
  };

  const updateActivity = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  const checkForTimeout = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now().toString(), 10);
    const timeSinceLastActivity = Date.now() - lastActivity;

    if (timeSinceLastActivity >= TIMEOUT_DURATION) {
      await logout();
    }
  };

  useEffect(() => {
    // Initialise last activity if not already set
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      updateActivity();
    }

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check immediately when the app becomes visible again (e.g. returning from background on mobile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForTimeout();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Regular interval check while app is active
    checkTimeoutRef.current = setInterval(checkForTimeout, CHECK_INTERVAL);

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (checkTimeoutRef.current) {
        clearInterval(checkTimeoutRef.current);
      }
    };
  }, []);

  return { logout };
};
