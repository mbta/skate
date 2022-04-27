import React from "react"
import { render } from "@testing-library/react"
import LeftNav from "../../../src/components/nav/leftNav"
import userEvent from "@testing-library/user-event"
import { BrowserRouter } from "react-router-dom"

describe("LeftNav", () => {
  test("renders non-collapsed state", () => {
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={false} />
      </BrowserRouter>
    )

    expect(result.queryByText("Route Ladders")).not.toBeNull()
  })

  test("renders collapsed state", () => {
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={true} />
      </BrowserRouter>
    )

    expect(result.queryByText("Route Ladders")).toBeNull()
  })

  test("can toggle collapsed", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={false} />
      </BrowserRouter>
    )

    await user.click(result.getByText("C"))

    expect(result.queryByText("Route Ladders")).toBeNull()

    await user.click(result.getByText("C"))

    expect(result.queryByText("Route Ladders")).not.toBeNull()
  })
})
