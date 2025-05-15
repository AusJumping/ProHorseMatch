import { useState, useEffect } from 'react';

export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if the device has touch capability
    const touchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;
    
    setIsTouchDevice(touchDevice);
  }, []);

  return isTouchDevice;
}