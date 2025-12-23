/**
 * Stub hook - minimal UI-only implementation
 */
import { useEffect } from "react";

export function useConversionPath() {
  useEffect(() => {
    // Stub: would track conversion path in real implementation
  }, []);
  
  return {
    trackClick: (..._args: any[]) => {},
    trackEvent: (..._args: any[]) => {},
    trackConversion: (..._args: any[]) => {},
    trackFormSubmit: (..._args: any[]) => {},
    trackPageView: (..._args: any[]) => {},
    trackFailure: (..._args: any[]) => {},
    trackSuccess: (..._args: any[]) => {},
  };
}

