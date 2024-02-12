import { test, expect, jest } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import AppStateWrapper from "../../src/components/appStateWrapper"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

test("renders", () => {
  jest.mocked(getTestGroups).mockReturnValue([TestGroups.KeycloakSso])
  const result = render(<AppStateWrapper />)
  expect(result.asFragment()).toMatchSnapshot()
})
