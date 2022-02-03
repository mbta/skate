import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DeletePresetModal from "../../../src/components/inputModals/deletePresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"

describe("DeletePresetModal", () => {
  test("can enter a name and save", () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <DeletePresetModal
          presetName="My Preset"
          deleteCallback={mockCallback}
        />
      </StateDispatchProvider>
    )

    userEvent.click(result.getByText("Confirm"))

    expect(mockCallback).toHaveBeenCalledWith(mockDispatch)
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })

  test("can cancel", () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <DeletePresetModal
          presetName="My Preset"
          deleteCallback={mockCallback}
        />
      </StateDispatchProvider>
    )

    userEvent.click(result.getByText("Cancel"))

    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })
})
