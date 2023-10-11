declare global {
  interface Window {
    Appcues?: {
      identify: (shortUsername: string) => void
      page: () => void
      show: (id: string) => void
    }
    // for Google Tag Manager
    dataLayer?: Record<string, any>[]
    drift: {
      api: {
        sidebar: {
          toggle: () => void
        }
      }
    }
    fullStoryInitialization?: {
      organizationId?: string | null
    }
    sentryInitialization?: {
      initArgs: {
        dsn: string
        environment: string
        release: string
      }
      orgSlug: string
    }
    sentry?: {
      dsn: string
    }
  }
}

export type UserToken = string

export type DeviceType =
  | "mobile"
  | "mobile_landscape_tablet_portrait"
  | "tablet"
  | "desktop"
