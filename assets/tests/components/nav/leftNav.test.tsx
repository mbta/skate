import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import LeftNav from "../../../src/components/nav/leftNav"
import userEvent from "@testing-library/user-event"
import { BrowserRouter } from "react-router-dom"
import { StateDispatchProvider } from "../../../src/contexts/stateDispatchContext"
import {
  initialState,
  OpenView,
  toggleLateView,
  toggleSwingsView,
} from "../../../src/state"
import { displayHelp } from "../../../src/helpers/appCue"

jest.mock("../../../src/helpers/appCue", () => ({
  __esModule: true,
  displayHelp: jest.fn(),
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

    expect(dispatch).toHaveBeenCalledWith(toggleLateView())
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

    expect(dispatch).toHaveBeenCalledWith(toggleSwingsView())
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
      "m-left-nav__link--active"
    )
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
})
