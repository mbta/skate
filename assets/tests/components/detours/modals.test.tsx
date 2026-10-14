import React from "react"
import { describe, expect, jest, test } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/jest-globals"
import { ConfirmCantDrawModal } from "../../../src/components/detours/modals/confirmCantDrawModal"
import { DiscardChangesModal } from "../../../src/components/detours/modals/discardChangesModal"
import { DeleteDetourModal } from "../../../src/components/detours/modals/deleteDraftModal"
import { DeactivateDetourModal } from "../../../src/components/detours/modals/deactivateModal"
import { ExtendDetourModal } from "../../../src/components/detours/modals/extendModal"

interface TestCase {
  name: string
  renderModal: (callbacks: [() => void, () => void]) => React.ReactElement
  expected: {
    title: string
    confirmButtonText: string
    cancelButtonText: string
    additionalAssertions?: () => void
  }
}

const testCases: TestCase[] = [
  {
    name: "ConfirmCantDrawModal",
    renderModal: ([onConfirm, onCancel]) => (
      <ConfirmCantDrawModal onConfirm={onConfirm} onCancel={onCancel} />
    ),
    expected: {
      title: "Text-only detour?",
      confirmButtonText: "Create text-only detour",
      cancelButtonText: "Cancel",
      additionalAssertions: () => {
        expect(
          screen.getByText(
            "Are you sure you want to create a text-only detour?"
          )
        ).toBeInTheDocument()
      },
    },
  },
  {
    name: "DiscardChangesModal",
    renderModal: ([onConfirm, onCancel]) => (
      <DiscardChangesModal
        onConfirm={onConfirm}
        onCancel={onCancel}
        affectedRoute={<span data-testid="affected-route">Route 1</span>}
      />
    ),
    expected: {
      title: "Discard unsaved changes?",
      confirmButtonText: "Discard changes",
      cancelButtonText: "Keep editing",
      additionalAssertions: () => {
        expect(screen.getByTestId("affected-route")).toBeInTheDocument()
        expect(
          screen.getByText("If you close now, your changes will be lost.")
        ).toBeInTheDocument()
      },
    },
  },
  {
    name: "DeleteDetourModal",
    renderModal: ([onDelete, onCancel]) => (
      <DeleteDetourModal
        onDelete={onDelete}
        onCancel={onCancel}
        affectedRoute={<span data-testid="affected-route">Route 1</span>}
      />
    ),
    expected: {
      title: "Delete Draft",
      confirmButtonText: "Delete draft",
      cancelButtonText: "Cancel",
      additionalAssertions: () => {
        expect(screen.getByTestId("affected-route")).toBeInTheDocument()
        expect(
          screen.getByText("Are you sure you want to delete this draft?")
        ).toBeInTheDocument()
      },
    },
  },
  {
    name: "DeactivateDetourModal",
    renderModal: ([onDeactivate, onCancel]) => (
      <DeactivateDetourModal
        onDeactivate={onDeactivate}
        onCancel={onCancel}
        routeName="1"
        routeDescription="Harvard"
        routeOrigin="Nubian - Harvard"
        routeDirection="Outbound"
      />
    ),
    expected: {
      title: "Return to regular route?",
      confirmButtonText: "Return to regular route",
      cancelButtonText: "Cancel",
      additionalAssertions: () => {
        expect(screen.getByText("Harvard")).toBeInTheDocument()
        expect(screen.getByText("from Nubian")).toBeInTheDocument()
        expect(screen.getByText("Outbound")).toBeInTheDocument()
        expect(
          screen.getByText(
            "Are you sure that you want to stop this detour and return to the regular route?"
          )
        ).toBeInTheDocument()
      },
    },
  },
  {
    name: "ExtendDetourModal",
    renderModal: ([onDeactivate, onCancel]) => (
      <ExtendDetourModal
        onDeactivate={onDeactivate}
        onCancel={onCancel}
        routeName="1"
        routeDescription="Harvard"
        routeOrigin="Nubian - Harvard"
        routeDirection="Outbound"
      />
    ),
    expected: {
      title: "Extend time or close detour",
      confirmButtonText: "Extend time",
      cancelButtonText: "Return to regular route",
      additionalAssertions: () => {
        expect(screen.getByText("Harvard")).toBeInTheDocument()
        expect(screen.getByText("from Nubian")).toBeInTheDocument()
        expect(screen.getByText("Outbound")).toBeInTheDocument()
      },
    },
  },
]

describe.each(testCases)(
  "$name",
  ({
    renderModal,
    expected: {
      title,
      confirmButtonText,
      cancelButtonText,
      additionalAssertions,
    },
  }) => {
    test("renders header title and action buttons", () => {
      render(renderModal([jest.fn(), jest.fn()]))

      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: confirmButtonText })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: cancelButtonText })
      ).toBeInTheDocument()

      if (additionalAssertions) {
        additionalAssertions()
      }
    })

    test(`triggers primary callback when clicking "${confirmButtonText}"`, async () => {
      const primaryMock = jest.fn()
      const cancelMock = jest.fn()
      render(renderModal([primaryMock, cancelMock]))

      await userEvent.click(
        screen.getByRole("button", { name: confirmButtonText })
      )
      expect(primaryMock).toHaveBeenCalledTimes(1)
      expect(cancelMock).not.toHaveBeenCalled()
    })

    test(`triggers cancel callback when clicking "${cancelButtonText}"`, async () => {
      const primaryMock = jest.fn()
      const cancelMock = jest.fn()
      render(renderModal([primaryMock, cancelMock]))

      await userEvent.click(
        screen.getByRole("button", { name: cancelButtonText })
      )
      expect(cancelMock).toHaveBeenCalledTimes(1)
      expect(primaryMock).not.toHaveBeenCalled()
    })

    test("triggers cancel callback when clicking header close button", async () => {
      const primaryMock = jest.fn()
      const cancelMock = jest.fn()
      render(renderModal([primaryMock, cancelMock]))

      await userEvent.click(screen.getByRole("button", { name: /close/i }))
      expect(cancelMock).toHaveBeenCalledTimes(1)
      expect(primaryMock).not.toHaveBeenCalled()
    })
  }
)
