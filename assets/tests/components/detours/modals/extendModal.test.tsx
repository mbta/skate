import React from "react"
import { describe, expect, jest, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { ExtendDetourModal } from "../../../../src/components/detours/modals/extendModal"

describe("ExtendDetourModal", () => {
  const defaultProps = {
    onDeactivate: jest.fn(),
    onCancel: jest.fn(),
    routeName: "1",
    routeDescription: "Harvard",
    routeOrigin: "Nubian - Harvard",
    routeDirection: "Outbound",
  }

  test("renders heading, route details, and buttons", () => {
    render(<ExtendDetourModal {...defaultProps} />)

    expect(
      screen.getByRole("heading", { name: "Extend time or close detour" })
    ).toBeInTheDocument()
    expect(screen.getByText("Harvard")).toBeInTheDocument()
    expect(screen.getByText("from Nubian")).toBeInTheDocument()
    expect(screen.getByText("Outbound")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Return to regular route" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Extend time" })
    ).toBeInTheDocument()
  })

  test("calls onDeactivate when Extend time button clicked", async () => {
    const onDeactivateMock = jest.fn()
    render(
      <ExtendDetourModal {...defaultProps} onDeactivate={onDeactivateMock} />
    )

    await userEvent.click(screen.getByRole("button", { name: "Extend time" }))
    expect(onDeactivateMock).toHaveBeenCalledTimes(1)
  })

  test("calls onCancel when Return to regular route button clicked", async () => {
    const onCancelMock = jest.fn()
    render(<ExtendDetourModal {...defaultProps} onCancel={onCancelMock} />)

    await userEvent.click(
      screen.getByRole("button", { name: "Return to regular route" })
    )
    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })
})
