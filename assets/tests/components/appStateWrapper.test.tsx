import { test, expect, jest, beforeEach } from "@jest/globals"
import React from "react"
import { render, waitFor } from "@testing-library/react"
import AppStateWrapper from "../../src/components/appStateWrapper"
import { fetchDetour, fetchRoutes, putRouteTabs } from "../../src/api"
import { neverPromise } from "../testHelpers/mockHelpers"

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
  jest.mocked(fetchRoutes).mockReturnValue(neverPromise())
  jest.mocked(putRouteTabs).mockReturnValue(neverPromise())
  jest.mocked(fetchDetour).mockReturnValue(neverPromise())
})

test("renders", async () => {
  const result = render(<AppStateWrapper />)
  await waitFor(() => expect(result.asFragment()).toMatchSnapshot())
})
