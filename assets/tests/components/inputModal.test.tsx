import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render, fireEvent, act } from "@testing-library/react"
import InputModal from "../../src/components/inputModal"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState, closeInputModal } from "../../src/state"

describe("InputModal", () => {
  test("can be dismissed with escape key", () => {
    const mockDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <InputModal>
          <>Hello, world!</>
        </InputModal>
      </StateDispatchProvider>
    )
    act(() => {
      fireEvent.keyDown(result.getByText("Hello, world!"), { key: "Escape" })
    })
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })
})
