import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OverwritePresetModal from "../../../src/components/inputModals/overwritePresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { mockFullStoryEvent } from "../../testHelpers/mockHelpers"

describe("OverwritePresetModal", () => {
  test("can confirm", async () => {
    mockFullStoryEvent()
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
    expect(window.FS!.event).toHaveBeenCalledWith(
      "User Overwrote a Saved Preset"
    )
  })

  test("can cancel", async () => {
    mockFullStoryEvent()
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
    expect(window.FS!.event).toHaveBeenCalledWith(
      "User canceled Overwriting a Saved Preset"
    )
  })
})
