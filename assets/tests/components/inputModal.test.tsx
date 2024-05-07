import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, waitFor } from "@testing-library/react"
import InputModal from "../../src/components/inputModal"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState, closeInputModal } from "../../src/state"
import userEvent from "@testing-library/user-event"

describe("InputModal", () => {
  test("can be dismissed with escape key", async () => {
    const mockDispatch = jest.fn()

    render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <InputModal>
          <>Hello, world!</>
        </InputModal>
      </StateDispatchProvider>
    )
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
    )
  })
})
