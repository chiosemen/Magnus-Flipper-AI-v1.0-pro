/**
 * Analytics Stub
 * Decoupled from worker packages
 */

export function recordEvent(eventName: string, properties?: Record<string, any>): void {
  // Stub: analytics disabled in decoupled web app
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, properties);
  }
}
