import React from "react"
import { describe, expect, jest, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { DeleteDetourModal } from "../../../../src/components/detours/modals/deleteDraftModal"

describe("DeleteDetourModal", () => {
  const defaultProps = {
    onDelete: jest.fn(),
    onCancel: jest.fn(),
    affectedRoute: <span data-testid="affected-route">Route 1</span>,
  }

  test("renders heading, affected route, message, and buttons", () => {
    render(<DeleteDetourModal {...defaultProps} />)

    expect(
      screen.getByRole("heading", { name: "Delete Draft" })
    ).toBeInTheDocument()
    expect(screen.getByTestId("affected-route")).toBeInTheDocument()
    expect(
      screen.getByText("Are you sure you want to delete this draft?")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Delete draft" })
    ).toBeInTheDocument()
  })

  test("calls onDelete when 'Delete draft' is clicked", async () => {
    const onDeleteMock = jest.fn()
    render(<DeleteDetourModal {...defaultProps} onDelete={onDeleteMock} />)

    await userEvent.click(
      screen.getByRole("button", { name: "Delete draft" })
    )
    expect(onDeleteMock).toHaveBeenCalledTimes(1)
  })

  test("calls onCancel when 'Cancel' is clicked", async () => {
    const onCancelMock = jest.fn()
    render(<DeleteDetourModal {...defaultProps} onCancel={onCancelMock} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })
})
