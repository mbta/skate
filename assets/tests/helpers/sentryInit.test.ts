import sentryInit from "../../src/helpers/sentryInit"
import * as Sentry from "@sentry/react"

jest.mock("@sentry/react", () => ({
  __esModule: true,
  init: jest.fn(),
  setUser: jest.fn(),
}))

const opts = {
  environment: "test_env",
  allowedUrls: ["url1", "url2"],
}

const username = "test_username"

test("Sentry Init runs", () => {
  sentryInit(opts, username)
  expect(Sentry.init).toHaveBeenCalledWith(opts)
  expect(Sentry.setUser).toHaveBeenCalledWith({ username: username })
})
