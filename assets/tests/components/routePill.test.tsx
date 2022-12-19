import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { RoutePill } from "../../src/components/routePill"

describe("RoutePill", () => {
  test.each([
    ["1", "1", "m-route-pill--bus"],
    ["SL1", "SL1", "m-route-pill--silver"],
    ["Red", "RL", "m-route-pill--red"],
    ["Orange", "OL", "m-route-pill--orange"],
    ["Blue", "BL", "m-route-pill--blue"],
    ["B", "GL·B", "m-route-pill--green"],
    ["C", "GL·C", "m-route-pill--green"],
    ["D", "GL·D", "m-route-pill--green"],
    ["E", "GL·E", "m-route-pill--green"],
  ])("renders %s", (routeName, expectedText, expectedClass) => {
    render(<RoutePill routeName={routeName} />)

    expect(screen.getByText(expectedText)).toBeInTheDocument()
    expect(screen.getByText(expectedText)).toHaveClass(expectedClass)
  })
})
