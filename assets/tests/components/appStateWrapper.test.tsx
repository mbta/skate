import { test, expect, jest } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import AppStateWrapper from "../../src/components/appStateWrapper"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

test("renders", () => {
  const result = render(<AppStateWrapper />)
  expect(result.asFragment()).toMatchSnapshot()
})
