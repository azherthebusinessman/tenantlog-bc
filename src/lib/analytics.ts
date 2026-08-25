declare global {
  interface Window {
    umami?: {
      track: (name: string) => void
    }
  }
}

export function trackEvent(name: string): void {
  try {
    window.umami?.track(name)
  } catch {
    // Analytics must never break the app
  }
}
