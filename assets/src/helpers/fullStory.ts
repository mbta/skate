import * as FullStory from "@fullstory/browser"

export const fullStoryInit = (
  orgId?: string | null,
  username?: string | null
) => {
  if (orgId) {
    FullStory.init({ orgId })

    if (username) {
      FullStory.identify(username, { displayName: username })
    }
  }
}

export const fullStoryEvent = (
  ...args: Parameters<typeof FullStory.event>
): void => {
  if (FullStory.isInitialized()) FullStory.event(...args)
}
