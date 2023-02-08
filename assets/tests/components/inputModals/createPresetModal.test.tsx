import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CreatePresetModal from "../../../src/components/inputModals/createPresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import routeTabFactory from "../../factories/routeTab"
import { mockFullStoryEvent } from "../../testHelpers/mockHelpers"

describe("CreatePresetModal", () => {
  test("can enter a name and save", async () => {
    mockFullStoryEvent()
    const mockCreateCallback = jest.fn()
    const mockOverwriteCallback = jest.fn()
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <CreatePresetModal
          createCallback={mockCreateCallback}
          confirmOverwriteCallback={mockOverwriteCallback}
        />
      </StateDispatchProvider>
    )

    await user.type(
      result.getByPlaceholderText("Name your preset", { exact: false }),
      "My Preset"
    )

    await user.click(result.getByText("Save"))

    expect(mockCreateCallback).toHaveBeenCalledWith("My Preset", mockDispatch)
    expect(mockOverwriteCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
    expect(window.FS!.event).toHaveBeenCalledWith("User saved a new Preset")
  })

  test("trying to save under an existing name invokes overwrite callback", async () => {
    mockFullStoryEvent()
    const mockCreateCallback = jest.fn()
    const mockOverwriteCallback = jest.fn()
    const mockDispatch = jest.fn()

    const routeTab = routeTabFactory.build({ presetName: "My Preset" })

    const state = {
      ...initialState,
      routeTabs: [routeTab],
    }

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <CreatePresetModal
          createCallback={mockCreateCallback}
          confirmOverwriteCallback={mockOverwriteCallback}
        />
      </StateDispatchProvider>
    )

    await user.type(
      result.getByPlaceholderText("Name your preset", { exact: false }),
      "My Preset"
    )

    await user.click(result.getByText("Save"))

    expect(mockCreateCallback).not.toHaveBeenCalled()
    expect(mockOverwriteCallback).toHaveBeenCalledWith(
      "My Preset",
      routeTab.uuid,
      mockDispatch
    )
    expect(window.FS!.event).toHaveBeenCalledWith(
      "User tried to Save new Preset under existing Name"
    )
  })

  test("can cancel", async () => {
    mockFullStoryEvent()
    const mockCreateCallback = jest.fn()
    const mockOverwriteCallback = jest.fn()
    const mockDispatch = jest.fn()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <CreatePresetModal
          createCallback={mockCreateCallback}
          confirmOverwriteCallback={mockOverwriteCallback}
        />
      </StateDispatchProvider>
    )

    await user.click(result.getByText("Cancel"))

    expect(mockCreateCallback).not.toHaveBeenCalled()
    expect(mockOverwriteCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
    expect(window.FS!.event).toHaveBeenCalledWith(
      "User canceled Creating a new Preset"
    )
  })
})
