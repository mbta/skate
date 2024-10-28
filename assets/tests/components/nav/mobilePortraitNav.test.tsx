import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"

import MobilePortraitNav from "../../../src/components/nav/mobilePortraitNav"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { initialState } from "../../../src/state"
import { BrowserRouter } from "react-router-dom"

describe("MobilePortraitNav", () => {
  test("renders top / bottom nav", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <MobilePortraitNav isViewOpen={false} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.queryByTitle("Swings View")).toBeVisible()
    expect(result.queryByTitle("Notifications")).toBeVisible()
  })

  test("doesn't render top / bottom nav when a view or panel is open", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <MobilePortraitNav isViewOpen={true} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.queryByTitle("Swings View")).not.toBeVisible()
    expect(result.queryByTitle("Notifications")).not.toBeVisible()
  })
})
