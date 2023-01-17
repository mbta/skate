import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import PickerContainer from "../../src/components/pickerContainer"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState, togglePickerContainer } from "../../src/state"

describe("PickerContainer", () => {
  test("clicking the collapse button hides the route picker", async () => {
    const mockDispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <PickerContainer>
          <div />
        </PickerContainer>
      </StateDispatchProvider>
    )
    expect(result.getByTestId("picker-container")).toHaveClass("visible")
    expect(result.getByTestId("picker-container")).not.toHaveClass("hidden")

    await user.click(result.getByRole("button", { name: "Collapse" }))

    expect(mockDispatch).toHaveBeenCalledWith(togglePickerContainer())
  })

  test("clicking the overlay hides the route picker", async () => {
    const mockDispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <PickerContainer>
          <div />
        </PickerContainer>
      </StateDispatchProvider>
    )

    await user.click(result.getByTestId("picker-container-overlay"))

    expect(mockDispatch).toHaveBeenCalledWith(togglePickerContainer())
  })
})
