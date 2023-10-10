import { jest, describe, test, expect } from "@jest/globals"
import "@testing-library/jest-dom/jest-globals"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import LeftNav from "../../../src/components/nav/leftNav"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import { displayHelp } from "../../../src/helpers/appCue"
import { openDrift } from "../../../src/helpers/drift"
import { tagManagerEvent } from "../../../src/helpers/googleTagManager"
import {
  initialState,
  openLateView,
  openNotificationDrawer,
  openSwingsView,
  OpenView,
  togglePickerContainer,
} from "../../../src/state"
import { TestGroups } from "../../../src/userInTestGroup"
import getTestGroups from "../../../src/userTestGroups"
import { fullStoryEvent } from "../../../src/helpers/fullStory"

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

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

jest.mock("../../../src/helpers/fullStory")

describe("LeftNav", () => {
  test("renders non-collapsed state", () => {
    const result = render(
      <BrowserRouter>
        <LeftNav
          defaultToCollapsed={false}
          dispatcherFlag={true}
          allowViews={true}
        />
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
        <LeftNav
          defaultToCollapsed={true}
          dispatcherFlag={true}
          allowViews={true}
        />
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

  test("renders nav item with title 'Search Map' if in map test group", () => {
    ;(getTestGroups as jest.Mock).mockReturnValueOnce([TestGroups.MapBeta])

    render(
      <BrowserRouter>
        <LeftNav
          defaultToCollapsed={true}
          dispatcherFlag={true}
          allowViews={true}
        />
      </BrowserRouter>
    )

    expect(screen.queryByTitle("Search")).toBeNull()
    expect(screen.getByTitle("Search Map")).toBeInTheDocument()
  })

  test("clicking 'Search Map' nav item triggers FullStory event", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    ;(getTestGroups as jest.Mock).mockReturnValueOnce([TestGroups.MapBeta])

    render(
      <BrowserRouter>
        <LeftNav
          defaultToCollapsed={true}
          dispatcherFlag={true}
          allowViews={true}
        />
      </BrowserRouter>
    )

    await userEvent.click(screen.getByRole("link", { name: "Search Map" }))

    expect(mockedFSEvent).toHaveBeenCalledWith("Search Map nav entry clicked")
  })

  test("can toggle nav menu on tablet layout", async () => {
    const toggleMobileMenu = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <LeftNav
          toggleMobileMenu={toggleMobileMenu}
          defaultToCollapsed={false}
          dispatcherFlag={false}
          allowViews={true}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Menu"))

    expect(toggleMobileMenu).toHaveBeenCalled()
  })

  test("can toggle collapsed", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <LeftNav
          defaultToCollapsed={false}
          dispatcherFlag={false}
          allowViews={true}
        />
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
        <LeftNav
          defaultToCollapsed={false}
          dispatcherFlag={false}
          allowViews={true}
        />
      </BrowserRouter>
    )

    expect(result.queryByText("Late View")).toBeNull()
  })

  test("clicking late view button toggles late view", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <LeftNav
            defaultToCollapsed={false}
            dispatcherFlag={true}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Late View"))

    expect(dispatch).toHaveBeenCalledWith(openLateView())
    expect(tagManagerEvent).toHaveBeenCalledWith("late_view_toggled")
    expect(mockedFSEvent).toHaveBeenCalledWith("User opened Late View")
  })

  test("clicking late view button closes picker container when flag is set", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, pickerContainerIsVisible: true }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <LeftNav
            defaultToCollapsed={true}
            dispatcherFlag={true}
            closePickerOnViewOpen={true}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Late View"))

    expect(dispatch).toHaveBeenCalledWith(togglePickerContainer())
  })

  test("clicking swings view button toggles swing view", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <LeftNav
            defaultToCollapsed={false}
            dispatcherFlag={false}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Swings View"))

    expect(dispatch).toHaveBeenCalledWith(openSwingsView())
    expect(tagManagerEvent).toHaveBeenCalledWith("swings_view_toggled")
    expect(mockedFSEvent).toHaveBeenCalledWith("User opened Swings View")
  })

  test("clicking swings view button closes picker container when flag is set", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, pickerContainerIsVisible: true }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <LeftNav
            defaultToCollapsed={true}
            dispatcherFlag={true}
            closePickerOnViewOpen={true}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Swings View"))

    expect(dispatch).toHaveBeenCalledWith(togglePickerContainer())
  })

  test("view button displays selected state when that view is enabled", async () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, openView: OpenView.Late }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <LeftNav
            defaultToCollapsed={false}
            dispatcherFlag={true}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Late View")).toHaveClass(
      "c-left-nav__view--active"
    )
  })

  test("clicking Support button opens Drift", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <LeftNav
          defaultToCollapsed={false}
          dispatcherFlag={false}
          allowViews={true}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("Support"))

    expect(openDrift).toHaveBeenCalled()
  })

  test("clicking About Skate button displays help", async () => {
    const user = userEvent.setup()
    const result = render(
      <BrowserRouter>
        <LeftNav
          defaultToCollapsed={false}
          dispatcherFlag={false}
          allowViews={true}
        />
      </BrowserRouter>
    )

    await user.click(result.getByTitle("About Skate"))

    expect(displayHelp).toHaveBeenCalled()
  })

  test("clicking notifications icon toggles notifications drawer and logs a tag manager event", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <BrowserRouter>
          <LeftNav
            defaultToCollapsed={false}
            dispatcherFlag={false}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Notifications"))

    expect(dispatch).toHaveBeenCalledWith(openNotificationDrawer())
    expect(tagManagerEvent).toHaveBeenCalledWith("notifications_opened")
  })

  test("clicking notifications closes picker container when flag is set", async () => {
    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, pickerContainerIsVisible: true }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <LeftNav
            defaultToCollapsed={true}
            dispatcherFlag={true}
            closePickerOnViewOpen={true}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await user.click(result.getByTitle("Notifications"))

    expect(dispatch).toHaveBeenCalledWith(togglePickerContainer())
  })

  test("notifications icon gets active class when notifications drawer is open", () => {
    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, openView: OpenView.NotificationDrawer }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <LeftNav
            defaultToCollapsed={false}
            dispatcherFlag={false}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Notifications").children[0]).toHaveClass(
      "c-left-nav__icon--notifications-view--active"
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
          <LeftNav
            defaultToCollapsed={false}
            dispatcherFlag={false}
            allowViews={true}
          />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Notifications").children[0]).not.toHaveClass(
      "c-left-nav__icon--notifications-view--active"
    )
  })

  test("views are disabled when allowViews prop is set to false", () => {
    render(
      <BrowserRouter>
        <LeftNav
          defaultToCollapsed={true}
          dispatcherFlag={true}
          allowViews={false}
        />
      </BrowserRouter>
    )

    expect(screen.getByRole("button", { name: "Late View" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    expect(screen.getByRole("button", { name: "Swings View" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    expect(
      screen.getByRole("button", { name: "Notifications" })
    ).toHaveAttribute("aria-disabled", "true")
  })
})
