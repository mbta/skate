declare global {
  interface Window {
    Appcues?: {
      identify: (shortUsername: string) => void
      page: () => void
      show: (id: string) => void
    }
    // we only need this for providing username
    clarity?(action: "identify", username: string): void
    // for Google Tag Manager
    dataLayer?: Record<string, any>[]
    drift: {
      api: {
        sidebar: {
          toggle: () => void
        }
      }
    }
    FS?: {
      // FullStory
      // see https://help.fullstory.com/develop-js/137379 for documentation
      identify(
        uid: string,
        opts: {
          displayName?: string
          email?: string
        }
      ): void
      event(event: string, properties?: object): void
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
