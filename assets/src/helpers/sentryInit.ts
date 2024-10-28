import * as Sentry from "@sentry/react"
import * as FullStory from "@fullstory/browser"
import SentryFullStory from "@sentry/fullstory"

interface sentryOptions {
  dsn?: string
  environment?: string
}

const sentryInit = (
  opts?: sentryOptions,
  username?: string,
  orgSlug?: string
) => {
  if (opts) {
    Sentry.init({
      ...opts,
      integrations: orgSlug
        ? [new SentryFullStory(orgSlug, { client: FullStory })]
        : undefined,
    })

    if (username) {
      Sentry.setUser({ username: username })
    }
  }
}

export default sentryInit
