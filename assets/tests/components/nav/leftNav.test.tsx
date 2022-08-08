import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import LeftNav from "../../../src/components/nav/leftNav"
import userEvent from "@testing-library/user-event"
import { BrowserRouter } from "react-router-dom"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import {
  initialState,
  openLateView,
  openSwingsView,
  openNotificationDrawer,
  OpenView,
} from "../../../src/state"
import { openDrift } from "../../../src/helpers/drift"
import { displayHelp } from "../../../src/helpers/appCue"
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"

jest.mock("../../../src/helpers/drift", () => ({
  __esModule: true,
  openDrift: jest.fn(),
}))

jest.mock("../../../src/helpers/appCue", () => ({
  __esModule: true,
  displayHelp: jest.fn(),
}))
jest.mock("../../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

describe("LeftNav", () => {
  test("renders non-collapsed state", () => {
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={false} dispatcherFlag={true} />
      </BrowserRouter>
    )

    expect(result.queryByText("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Late View")).not.toBeNull()
    expect(result.queryByText("Swings View")).not.toBeNull()
    expect(result.queryByText("Shuttle Map")).not.toBeNull()
    expect(result.queryByText("Search")).not.toBeNull()
    expect(result.queryByText("Support")).not.toBeNull()
    expect(result.queryByText("About Skate")).not.toBeNull()
    expect(result.queryByText("Settings")).not.toBeNull()
    expect(result.queryByText("Collapse")).not.toBeNull()
  })

  test("renders collapsed state", () => {
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={true} dispatcherFlag={true} />
      </BrowserRouter>
    )

    expect(result.queryByText("Route Ladders")).toBeNull()
    expect(result.queryByTitle("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Late View")).toBeNull()
    expect(result.queryByTitle("Late View")).not.toBeNull()
    expect(result.queryByText("Swings View")).toBeNull()
    expect(result.queryByTitle("Swings View")).not.toBeNull()
    expect(result.queryByText("Shuttle Map")).toBeNull()
    expect(result.queryByTitle("Shuttle Map")).not.toBeNull()
    expect(result.queryByText("Search")).toBeNull()
    expect(result.queryByTitle("Search")).not.toBeNull()
    expect(result.queryByText("Support")).toBeNull()
    expect(result.queryByTitle("Support")).not.toBeNull()
    expect(result.queryByText("About Skate")).toBeNull()
    expect(result.queryByTitle("About Skate")).not.toBeNull()
    expect(result.queryByText("Settings")).toBeNull()
    expect(result.queryByTitle("Settings")).not.toBeNull()
    expect(result.queryByText("Expand")).toBeNull()
    expect(result.queryByTitle("Expand")).not.toBeNull()
  })

  test("renders tablet layout", () => {
    const toggleMobileMenu = jest.fn()
    const result = render(
      <BrowserRouter>
        <LeftNav
          toggleMobileMenu={toggleMobileMenu}
          defaultToCollapsed={false}
          dispatcherFlag={false}
        />
      </BrowserRouter>
    )

    expect(result.queryByTitle("Menu")).not.toBeNull()
  })

  test("can toggle collapsed", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={false} dispatcherFlag={false} />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Collapse"))

    expect(result.queryByText("Route Ladders")).toBeNull()

    await user.click(result.getByTitle("Expand"))

    expect(result.queryByText("Route Ladders")).not.toBeNull()
  })

  test("does not render late view option when dispatcher flag is false", () => {
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={false} dispatcherFlag={false} />
      </BrowserRouter>
    )

    expect(result.queryByText("Late View")).toBeNull()
  })

  test("clicking late view button toggles late view", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <LeftNav defaultToCollapsed={false} dispatcherFlag={true} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Late View"))

    expect(dispatch).toHaveBeenCalledWith(openLateView())
    expect(tagManagerEvent).toHaveBeenCalledWith("late_view_toggled")
  })

  test("clicking swings view button toggles swing view", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <LeftNav defaultToCollapsed={false} dispatcherFlag={false} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Swings View"))

    expect(dispatch).toHaveBeenCalledWith(openSwingsView())
    expect(tagManagerEvent).toHaveBeenCalledWith("swings_view_toggled")
  })

  test("view button displays selected state when that view is enabled", async () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, openView: OpenView.Late }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <LeftNav defaultToCollapsed={false} dispatcherFlag={true} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Late View")).toHaveClass(
      "m-left-nav__view--active"
    )
  })

  test("clicking Support button opens Drift", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={false} dispatcherFlag={false} />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Support"))

    expect(openDrift).toHaveBeenCalled()
  })

  test("clicking About Skate button displays help", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <LeftNav defaultToCollapsed={false} dispatcherFlag={false} />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("About Skate"))

    expect(displayHelp).toHaveBeenCalled()
  })

  test("clicking notifications icon toggles notifications drawer", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <LeftNav defaultToCollapsed={false} dispatcherFlag={false} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Notifications"))

    expect(dispatch).toHaveBeenCalledWith(openNotificationDrawer())
  })

  test("notifications icon gets active class when notifications drawer is open", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, openView: OpenView.NotificationDrawer }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <LeftNav defaultToCollapsed={false} dispatcherFlag={false} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Notifications").children[0]).toHaveClass(
      "m-left-nav__icon--notifications-view--active"
    )
  })

  test("notifications icon doesn't get active class when notifications drawer is closed", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, openView: OpenView.None }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <LeftNav defaultToCollapsed={false} dispatcherFlag={false} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Notifications").children[0]).not.toHaveClass(
      "m-left-nav__icon--notifications-view--active"
    )
  })
})
