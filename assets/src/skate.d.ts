declare global {
  interface Window {
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
    userInfo?: {
      id: string
      username: string
    }
  }
}

export type UserToken = string
