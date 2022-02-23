import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OverwritePresetModal from "../../../src/components/inputModals/overwritePresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"

describe("OverwritePresetModal", () => {
  test("can confirm", () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <OverwritePresetModal
          presetName="My Preset"
          confirmCallback={mockCallback}
        />
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
        <OverwritePresetModal
          presetName="My Preset"
          confirmCallback={mockCallback}
        />
      </StateDispatchProvider>
    )

    userEvent.click(result.getByText("Cancel"))

    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })
})
