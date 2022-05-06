import sentryInit from "../../src/helpers/sentryInit"
import * as Sentry from "@sentry/react"

jest.mock("@sentry/react", () => ({
  __esModule: true,
  init: jest.fn(),
}))

const opts = {
  environment: "test_env",
}

test("Sentry Init runs", () => {
  sentryInit(opts)
  expect(Sentry.init).toHaveBeenCalledWith(opts)
})
