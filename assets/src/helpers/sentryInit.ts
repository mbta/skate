import * as Sentry from "@sentry/react"

interface sentryOptions {
  dsn?: string
  environment?: string
}

const sentryInit = (
  opts: sentryOptions | undefined,
  username: string | undefined
) => {
  if (opts) {
    Sentry.init(opts)

    if (username) {
      Sentry.setUser({ username: username })
    }
  }
}

export default sentryInit
