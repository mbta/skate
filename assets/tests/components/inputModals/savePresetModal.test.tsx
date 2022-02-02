import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SavePresetModal from "../../../src/components/inputModals/savePresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"

describe("SavePresetModal", () => {
  test("can enter a name and save", () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <SavePresetModal presetName="My Preset" saveCallback={mockCallback} />
      </StateDispatchProvider>
    )

    userEvent.click(result.getByText("Save"))

    expect(mockCallback).toHaveBeenCalledWith(mockDispatch)
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })

  test("can cancel", () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <SavePresetModal presetName="My Preset" saveCallback={mockCallback} />
      </StateDispatchProvider>
    )

    userEvent.click(result.getByText("Cancel"))

    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })
})
