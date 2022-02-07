import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CreatePresetModal from "../../../src/components/inputModals/createPresetModal"
import { initialState, closeInputModal } from "../../../src/state"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"

describe("CreatePresetModal", () => {
  test("can enter a name and save", () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <CreatePresetModal createCallback={mockCallback} />
      </StateDispatchProvider>
    )

    userEvent.type(
      result.getByPlaceholderText("Name your preset", { exact: false }),
      "My Preset"
    )

    userEvent.click(result.getByText("Save"))

    expect(mockCallback).toHaveBeenCalledWith("My Preset", mockDispatch)
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })

  test("can cancel", () => {
    const mockCallback = jest.fn()
    const mockDispatch = jest.fn()

    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <CreatePresetModal createCallback={mockCallback} />
      </StateDispatchProvider>
    )

    userEvent.click(result.getByText("Cancel"))

    expect(mockCallback).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(closeInputModal())
  })
})
