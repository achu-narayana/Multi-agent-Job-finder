import { useEffect, useState } from "react";

/**
 * True from the first frame after mount. Charts and counters animate from here
 * on load rather than waiting for a scroll observer, so the page is complete at
 * rest (thumbnails, shared links, readers who never scroll).
 */
export function useEntered(): boolean {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return entered;
}
