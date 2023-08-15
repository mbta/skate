import { jest, describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DeletePresetModal from "../../../src/components/inputModals/deletePresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"
import { mockFullStoryEvent } from "../../testHelpers/mockHelpers"

jest.mock("../../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

describe("DeletePresetModal", () => {
  test("can confirm deletion", async () => {
    mockFullStoryEvent()
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <DeletePresetModal
          presetName="My Preset"
          deleteCallback={mockCallback}
        />
      </StateDispatchProvider>
    )

    await user.click(result.getByText("Confirm"))

    expect(mockCallback).toHaveBeenCalledWith(mockDispatch)
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
    expect(tagManagerEvent).toHaveBeenCalledWith("preset_deleted")
    expect(window.FS!.event).toHaveBeenCalledWith("User deleted a preset")
  })

  test("can cancel", async () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <DeletePresetModal
          presetName="My Preset"
          deleteCallback={mockCallback}
        />
      </StateDispatchProvider>
    )

    await user.click(result.getByText("Cancel"))

    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })
})
