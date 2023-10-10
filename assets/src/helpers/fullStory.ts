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
  eventName: string,
  eventProperties?: { [key: string]: any }
): void => {
  FullStory.isInitialized() && FullStory.event(eventName, eventProperties || {})

  return
}
