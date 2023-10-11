import { jest, describe, test, expect } from "@jest/globals"
import sentryInit from "../../src/helpers/sentryInit"
import * as Sentry from "@sentry/react"
import SentryFullStory from "@sentry/fullstory"

jest.mock("@sentry/react")

const opts = {
  environment: "test_env",
}

const username = "test_username"

const orgSlug = "test_org_slug"

describe("sentryInit", () => {
  test("Sentry.init runs with username", () => {
    const mockedSentry = jest.mocked(Sentry)

    sentryInit(opts, username)
    expect(mockedSentry.init).toHaveBeenCalledWith(opts)
    expect(mockedSentry.setUser).toHaveBeenCalledWith({ username: username })
  })

  test("Sentry.init runs without username", () => {
    const mockedSentry = jest.mocked(Sentry)

    sentryInit(opts)
    expect(mockedSentry.init).toHaveBeenCalledWith(opts)
    expect(mockedSentry.setUser).not.toHaveBeenCalled()
  })

  test("Sentry.init runs with organization slug to add FullStory integration", () => {
    const mockedSentry = jest.mocked(Sentry)

    sentryInit(opts, username, orgSlug)

    const integrations = mockedSentry.init.mock.calls[0][0].integrations
    if (integrations !== undefined && typeof integrations !== "function") {
      expect(integrations[0]).toBeInstanceOf(SentryFullStory)
    }
  })
})
