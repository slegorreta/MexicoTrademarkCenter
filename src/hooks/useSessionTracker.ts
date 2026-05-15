import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logSession } from '../lib/analytics';

// Fires a session log on every route change. Accepts the current language string.
export function useSessionTracker(language: string) {
  const location = useLocation();

  useEffect(() => {
    logSession(language, location.pathname);
  }, [location.pathname, language]);
}
