import { useEffect, useState } from "react";

const DEFAULT_BREAKPOINT = 768;

/**
 * Returns true when the viewport width is below the provided breakpoint (default 768px).
 */
export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(() => (typeof window === "undefined" ? false : window.innerWidth < breakpoint));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}
