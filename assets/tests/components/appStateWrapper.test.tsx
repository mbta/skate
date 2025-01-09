import { test, expect, jest, beforeEach } from "@jest/globals"
import React from "react"
import { render, waitFor } from "@testing-library/react"
import AppStateWrapper from "../../src/components/appStateWrapper"
import { fetchDetour, fetchRoutes, putRouteTabs } from "../../src/api"

// Avoid Halloween
jest
  .useFakeTimers({ doNotFake: ["setTimeout"] })
  .setSystemTime(new Date("2024-08-29T20:00:00"))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(fetchRoutes).mockImplementation(() => new Promise(() => {}))
  jest.mocked(putRouteTabs).mockImplementation(() => new Promise(() => {}))
  jest.mocked(fetchDetour).mockImplementation(() => new Promise(() => {}))
})

test("renders", async () => {
  const result = render(<AppStateWrapper />)
  await waitFor(() => expect(result.asFragment()).toMatchSnapshot())
})
