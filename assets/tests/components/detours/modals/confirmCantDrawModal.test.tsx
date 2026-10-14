import React from "react"
import { describe, expect, jest, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { ConfirmCantDrawModal } from "../../../../src/components/detours/modals/confirmCantDrawModal"

describe("ConfirmCantDrawModal", () => {
  test("renders title, body description, and buttons", () => {
    render(<ConfirmCantDrawModal onConfirm={jest.fn()} onCancel={jest.fn()} />)

    expect(
      screen.getByRole("heading", { name: "Text-only detour?" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("Are you sure you want to create a text-only detour?")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Create text-only detour" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  test("triggers onConfirm when confirm button clicked", async () => {
    const onConfirmMock = jest.fn()
    render(
      <ConfirmCantDrawModal onConfirm={onConfirmMock} onCancel={jest.fn()} />
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Create text-only detour" })
    )
    expect(onConfirmMock).toHaveBeenCalledTimes(1)
  })

  test("triggers onCancel when cancel button clicked", async () => {
    const onCancelMock = jest.fn()
    render(
      <ConfirmCantDrawModal onConfirm={jest.fn()} onCancel={onCancelMock} />
    )

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })
})
