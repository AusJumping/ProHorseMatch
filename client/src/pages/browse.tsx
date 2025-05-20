import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Home from './home';

export default function Browse() {
  const [location, navigate] = useLocation();
  
  // Detect if we have filter parameters in the URL
  const hasFilters = location.includes('?');
  
  // Simply render the Home component which already has the filter logic
  return <Home />;
}