import { useEffect } from 'react';

const LAST_ACTIVITY_KEY = 'lastActivityTime';

// Inactivity auto-logout is disabled — users stay logged in until they
// explicitly tap "Logout". This hook now only keeps a record of the last
// activity time (harmless) and performs no automatic logout.
export const useAutoLogout = () => {
  const updateActivity = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  useEffect(() => {
    updateActivity();
  }, []);

  return {};
};
