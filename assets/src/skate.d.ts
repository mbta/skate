import ResizeObserver from "resize-observer-polyfill"

declare global {
  interface Window {
    Appcues?: {
      identify: (userId: string) => void
      page: () => void
      show: (id: string) => void
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
    ResizeObserver: typeof ResizeObserver
    drift: {
      api: {
        sidebar: {
          toggle: () => void
        }
      }
    }
    username: string
    sentry?: {
      dsn: string
    }
  }
}

export type UserToken = string
