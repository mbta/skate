import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OverwritePresetModal from "../../../src/components/inputModals/overwritePresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"

describe("OverwritePresetModal", () => {
  test("can confirm", async () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <OverwritePresetModal
          presetName="My Preset"
          confirmCallback={mockCallback}
        />
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
        <OverwritePresetModal
          presetName="My Preset"
          confirmCallback={mockCallback}
        />
      </StateDispatchProvider>
    )

    await user.click(result.getByText("Cancel"))

    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })
})
