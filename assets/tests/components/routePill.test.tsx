import { describe, test, expect } from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import { RoutePill } from "../../src/components/routePill"

describe("RoutePill", () => {
  test.each([
    ["1", "1", "c-route-pill--bus"],
    ["SL1", "SL1", "c-route-pill--silver"],
    ["Red Line", "RL", "c-route-pill--red"],
    ["Orange Line", "OL", "c-route-pill--orange"],
    ["Blue Line", "BL", "c-route-pill--blue"],
    ["B", "GL·B", "c-route-pill--green"],
    ["C", "GL·C", "c-route-pill--green"],
    ["D", "GL·D", "c-route-pill--green"],
    ["E", "GL·E", "c-route-pill--green"],
    ["Mattapan Trolley", "M", "c-route-pill--red"],
  ])("renders %s", (routeName, expectedText, expectedClass) => {
    render(<RoutePill routeName={routeName} />)

    expect(screen.getByText(expectedText)).toBeInTheDocument()
    expect(screen.getByText(expectedText)).toHaveClass(expectedClass)
  })
})
