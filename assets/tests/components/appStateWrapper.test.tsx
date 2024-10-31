import { test, expect, jest } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import AppStateWrapper from "../../src/components/appStateWrapper"

// Avoid Halloween
jest
  .useFakeTimers({ doNotFake: ["setTimeout"] })
  .setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

test("renders", () => {
  const result = render(<AppStateWrapper />)
  expect(result.asFragment()).toMatchSnapshot()
})
