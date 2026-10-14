import React from "react"
import { describe, expect, jest, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { BaseModal } from "../../../../src/components/detours/modals/baseModal"

describe("BaseModal", () => {
  test("renders header with title, body, and footer", () => {
    render(
      <BaseModal
        title="Test Modal Title"
        onCancel={jest.fn()}
        footer={<button>Footer Action</button>}
      >
        <p>Test Modal Content</p>
      </BaseModal>
    )

    expect(
      screen.getByRole("heading", { name: "Test Modal Title" })
    ).toBeInTheDocument()
    expect(screen.getByText("Test Modal Content")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Footer Action" })
    ).toBeInTheDocument()
  })

  test("calls onCancel when close button is clicked", async () => {
    const onCancelMock = jest.fn()
    render(
      <BaseModal title="Close Test" onCancel={onCancelMock}>
        <p>Content</p>
      </BaseModal>
    )

    const closeButton = screen.getByRole("button", { name: /close/i })
    await userEvent.click(closeButton)

    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })

  test("does not render when show is false", () => {
    render(
      <BaseModal show={false} title="Hidden Modal" onCancel={jest.fn()}>
        <p>Hidden Content</p>
      </BaseModal>
    )

    expect(
      screen.queryByRole("heading", { name: "Hidden Modal" })
    ).not.toBeInTheDocument()
  })
})
