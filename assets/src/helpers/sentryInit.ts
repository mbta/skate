import * as Sentry from "@sentry/react"

interface sentryOptions {
	dsn?: string;
	environment?: string;
}

const sentryInit = (opts: sentryOptions | undefined) => {

	
	if (opts) {

	  Sentry.init(opts)

	  if (window.username) {
	    Sentry.setUser({ username: window.username })
	  }
	}

	return Sentry
}

export default sentryInit