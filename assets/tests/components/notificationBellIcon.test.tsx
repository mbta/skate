import React from "react"
import renderer from "react-test-renderer"
import NotificationBellIcon from "../../src/components/notificationBellIcon"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState } from "../../src/state"

describe("NotificationBellIcon", () => {
  test("renders when the drawer is closed", () => {
    const state = { ...initialState, notificationDrawerIsOpen: false }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <NotificationBellIcon />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders when the drawer is open", () => {
    const state = { ...initialState, notificationDrawerIsOpen: true }
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={jest.fn()}>
          <NotificationBellIcon />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
