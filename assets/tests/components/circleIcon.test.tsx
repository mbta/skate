import { describe, expect, jest, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import userEvent from "@testing-library/user-event"
import React from "react"
import { CircleButton } from "../../src/components/circleButton"

describe("CircleIcon", () => {
  test("calls onClick callback when clicked", async () => {
    const onClick = jest.fn()

    render(
      <CircleButton isActive={false} onClick={onClick} title="Test Button" />
    )

    await userEvent.click(screen.getByTitle("Test Button"))

    expect(onClick).toHaveBeenCalled()
  })

  test("handles active state", () => {
    render(<CircleButton isActive={true} title="Test Button" />)

    expect(screen.getByTitle("Test Button")).toHaveClass(
      "c-circle-button--active"
    )
  })
})
