import ResizeObserver from "resize-observer-polyfill"

declare global {
  interface Window {
    Appcues?: {
      identify: (userId: string) => void
      page: () => void
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
    }
    ResizeObserver: typeof ResizeObserver
    username: string
  }
}

export type UserToken = string
