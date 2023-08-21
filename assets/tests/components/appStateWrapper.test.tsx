import { test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import AppStateWrapper from "../../src/components/appStateWrapper"

test("renders", () => {
  const result = render(<AppStateWrapper />)
  expect(result.asFragment()).toMatchSnapshot()
})
