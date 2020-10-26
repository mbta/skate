import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import NotificationDrawer from "../../src/components/notificationDrawer"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { closeNotificationDrawer, initialState } from "../../src/state"

describe("NotificationDrawer", () => {
  test("renders", () => {
    const tree = renderer.create(<NotificationDrawer />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("close button closes the drawer", () => {
    const dispatch = jest.fn()
    const wrapper = mount(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <NotificationDrawer />
      </StateDispatchProvider>
    )

    wrapper.find(".m-close-button").first().simulate("click")
    expect(dispatch).toHaveBeenCalledWith(closeNotificationDrawer())
  })
})
