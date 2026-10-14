import React from "react"
import { describe, expect, jest, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { DiscardChangesModal } from "../../../../src/components/detours/modals/discardChangesModal"

describe("DiscardChangesModal", () => {
  test("renders title, affected route, and action buttons", () => {
    render(
      <DiscardChangesModal
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        affectedRoute={<span data-testid="affected-route">Route 1</span>}
      />
    )

    expect(
      screen.getByRole("heading", { name: "Discard unsaved changes?" })
    ).toBeInTheDocument()
    expect(screen.getByTestId("affected-route")).toBeInTheDocument()
    expect(
      screen.getByText("If you close now, your changes will be lost.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Keep editing" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Discard changes" })
    ).toBeInTheDocument()
  })

  test("triggers onConfirm when discard changes clicked", async () => {
    const onConfirmMock = jest.fn()
    render(
      <DiscardChangesModal
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
        affectedRoute={<span>Route 1</span>}
      />
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Discard changes" })
    )
    expect(onConfirmMock).toHaveBeenCalledTimes(1)
  })

  test("triggers onCancel when keep editing clicked", async () => {
    const onCancelMock = jest.fn()
    render(
      <DiscardChangesModal
        onConfirm={jest.fn()}
        onCancel={onCancelMock}
        affectedRoute={<span>Route 1</span>}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }))
    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })
})
