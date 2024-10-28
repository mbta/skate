import { test, describe, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import { MapButton } from "../../../../src/components/map/controls/mapButton"
import { PlusSquare } from "../../../../src/helpers/bsIcons"

describe("MapButton", () => {
  test("includes title at large size", () => {
    render(
      <MapButton size="lg" title="Button">
        <PlusSquare />
      </MapButton>
    )

    expect(screen.getByText("Button")).toBeInTheDocument()
  })

  test.each([
    { size: "sm", name: "small" },
    { size: undefined, name: "medium" },
  ])("does not include title at $name size", ({ size }) => {
    render(
      <MapButton size={size} title="Button">
        <PlusSquare />
      </MapButton>
    )

    expect(screen.queryByText("Button")).not.toBeInTheDocument()
  })

  test.each(["sm", "lg"])("includes CSS class for %s size", (size) => {
    render(
      <MapButton size={size} title="Button">
        <PlusSquare />
      </MapButton>
    )

    expect(screen.getByRole("button", { name: "Button" })).toHaveClass(
      `c-map-button--${size}`
    )
  })
})
