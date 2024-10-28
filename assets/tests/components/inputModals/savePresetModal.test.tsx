import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SavePresetModal from "../../../src/components/inputModals/savePresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"

describe("SavePresetModal", () => {
  test("can save", async () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <SavePresetModal presetName="My Preset" saveCallback={mockCallback} />
      </StateDispatchProvider>
    )

    await user.click(result.getByText("Save"))

    expect(mockCallback).toHaveBeenCalledWith(mockDispatch)
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })

  test("can cancel", async () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <SavePresetModal presetName="My Preset" saveCallback={mockCallback} />
      </StateDispatchProvider>
    )

    await user.click(result.getByText("Cancel"))

    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })
})
