import React from "react"
import { render } from "@testing-library/react"
import LeftNav from "../../../src/components/nav/leftNav"
import userEvent from "@testing-library/user-event"

describe("LeftNav", () => {
  test("renders non-collapsed state", () => {
    const result = render(<LeftNav defaultToCollapsed={false} />)

    expect(result.queryByText(/Collapsed: false/)).not.toBeNull()
  })
  test("renders collapsed state", () => {
    const result = render(<LeftNav defaultToCollapsed={true} />)

    expect(result.queryByText(/Collapsed: true/)).not.toBeNull()
  })
  test("can toggle collapsed", () => {
    const result = render(<LeftNav defaultToCollapsed={false} />)

    userEvent.click(result.getByText("Toggle Collapsed"))

    expect(result.queryByText(/Collapsed: true/)).not.toBeNull()

    userEvent.click(result.getByText("Toggle Collapsed"))

    expect(result.queryByText(/Collapsed: false/)).not.toBeNull()
  })
})
