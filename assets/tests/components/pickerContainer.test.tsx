import { mount } from "enzyme"
import React from "react"
import PickerContainer from "../../src/components/pickerContainer"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState, togglePickerContainer } from "../../src/state"

describe("PickerContainer", () => {
  test("clicking the collapse button hides the route picker", () => {
    const mockDispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={mockDispatch}>
        <PickerContainer>
          <div />
        </PickerContainer>
      </StateDispatchProvider>
    )
    expect(wrapper.find(".m-picker-container").hasClass("visible")).toBeTruthy()
    expect(wrapper.find(".m-picker-container").hasClass("hidden")).toBeFalsy()

    wrapper
      .find(".m-picker-container .c-drawer-tab__tab-button")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(togglePickerContainer())
  })
})
