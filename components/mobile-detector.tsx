import { useState, useEffect } from 'react';

export function useMobileDetect() {
  // Initialize with false (desktop) as default to prevent layout shift
  // This matches the common case and prevents flash of mobile layout
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}