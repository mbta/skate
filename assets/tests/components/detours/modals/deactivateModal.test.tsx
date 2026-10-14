import React from "react"
import { describe, expect, jest, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { DeactivateDetourModal } from "../../../../src/components/detours/modals/deactivateModal"

describe("DeactivateDetourModal", () => {
  const defaultProps = {
    onDeactivate: jest.fn(),
    onCancel: jest.fn(),
    routeName: "1",
    routeDescription: "Harvard",
    routeOrigin: "Nubian - Harvard",
    routeDirection: "Outbound",
  }

  test("renders heading, route information, and buttons", () => {
    render(<DeactivateDetourModal {...defaultProps} />)

    expect(
      screen.getByRole("heading", { name: "Return to regular route?" })
    ).toBeInTheDocument()
    expect(screen.getByText("Harvard")).toBeInTheDocument()
    expect(screen.getByText("from Nubian")).toBeInTheDocument()
    expect(screen.getByText("Outbound")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Are you sure that you want to stop this detour and return to the regular route?"
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Return to regular route" })
    ).toBeInTheDocument()
  })

  test("calls onDeactivate when 'Return to regular route' is clicked", async () => {
    const onDeactivateMock = jest.fn()
    render(
      <DeactivateDetourModal
        {...defaultProps}
        onDeactivate={onDeactivateMock}
      />
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Return to regular route" })
    )
    expect(onDeactivateMock).toHaveBeenCalledTimes(1)
  })

  test("calls onCancel when 'Cancel' is clicked", async () => {
    const onCancelMock = jest.fn()
    render(<DeactivateDetourModal {...defaultProps} onCancel={onCancelMock} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })
})
