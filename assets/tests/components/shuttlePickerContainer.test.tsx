import React from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import ShuttlePickerContainer from "../../src/components/shuttlePickerContainer"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState, togglePickerContainer } from "../../src/state"

describe("ShuttlePickerContainer", () => {
  test("clicking the collapse button hides the route picker", async () => {
    const mockDispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <ShuttlePickerContainer>
          <div />
        </ShuttlePickerContainer>
      </StateDispatchProvider>
    )
    expect(result.getByTestId("shuttle-picker-container")).toHaveClass(
      "visible"
    )

    await user.click(result.getByRole("button", { name: "Collapse" }))

    expect(mockDispatch).toHaveBeenCalledWith(togglePickerContainer())
  })

  test("is not visible when picker is closed in state", () => {
    const mockDispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, pickerContainerIsVisible: false }}
        dispatch={mockDispatch}
      >
        <ShuttlePickerContainer>
          <div />
        </ShuttlePickerContainer>
      </StateDispatchProvider>
    )
    expect(result.getByTestId("shuttle-picker-container")).toHaveClass("hidden")
  })
})
