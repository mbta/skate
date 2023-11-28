import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"

import Nav from "../../src/components/nav"
import useScreenSize from "../../src/hooks/useScreenSize"
import getTestGroups from "../../src/userTestGroups"
import { TestGroups } from "../../src/userInTestGroup"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import stateFactory from "../factories/applicationState"
import { viewFactory } from "../factories/pagePanelStateFactory"
import { OpenView } from "../../src/state/pagePanelState"
import vehicleFactory from "../factories/vehicle"

jest.mock("../../src/hooks/useScreenSize", () => ({
  __esModule: true,
  default: jest.fn(() => "desktop"),
}))

jest.mock("userTestGroups", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}))

beforeEach(() => {
  ;(getTestGroups as jest.Mock).mockReturnValue([])
})

describe("Nav", () => {
  test("renders mobile nav content", () => {
    ;(useScreenSize as jest.Mock).mockImplementationOnce(() => "mobile")

    const result = render(
      <BrowserRouter>
        <Nav>Hello, world!</Nav>
      </BrowserRouter>
    )

    expect(result.getByTestId("top-nav-mobile")).not.toBeNull()
    expect(result.getByTestId("bottom-nav-mobile")).not.toBeNull()
  })

  test("renders mobile landscape / tablet portrait nav content", () => {
    ;(useScreenSize as jest.Mock).mockImplementationOnce(
      () => "mobile_landscape_tablet_portrait"
    )

    const result = render(
      <BrowserRouter>
        <Nav>Hello, world!</Nav>
      </BrowserRouter>
    )

    expect(result.queryByTitle("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Route Ladders")).toBeNull()
  })

  test("renders mobile landscape / tablet portrait nav content with nav elements hidden when a view is open", () => {
    jest
      .mocked(useScreenSize)
      .mockReturnValueOnce("mobile_landscape_tablet_portrait")
    const dispatch = jest.fn()

    const result = render(
      <StateDispatchProvider
        state={stateFactory.build({
          view: viewFactory.currentState({ openView: OpenView.Swings }).build(),
        })}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <Nav>Hello, world!</Nav>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Route Ladders")).not.toBeVisible()
  })

  test("renders mobile landscape / tablet portrait nav content with nav elements hidden when a vehicle is selected", () => {
    jest
      .mocked(useScreenSize)
      .mockReturnValueOnce("mobile_landscape_tablet_portrait")
    const dispatch = jest.fn()

    const result = render(
      <StateDispatchProvider
        state={stateFactory.build({
          view: viewFactory
            .currentState({ selectedVehicleOrGhost: vehicleFactory.build() })
            .build(),
        })}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <Nav>Hello, world!</Nav>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.getByTitle("Route Ladders")).not.toBeVisible()
  })

  test("renders tablet nav content", () => {
    ;(useScreenSize as jest.Mock).mockImplementationOnce(() => "tablet")

    const result = render(
      <BrowserRouter>
        <Nav>Hello, world!</Nav>
      </BrowserRouter>
    )

    expect(result.queryByTitle("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Route Ladders")).toBeNull()
  })

  test("renders nav item with title 'Search Map' if in map test group", () => {
    ;(getTestGroups as jest.Mock).mockReturnValue([TestGroups.MapBeta])

    render(
      <BrowserRouter>
        <Nav>Hello, world!</Nav>
      </BrowserRouter>
    )

    expect(screen.queryByTitle("Search")).toBeNull()
    expect(screen.queryByTitle("Search Map")).toBeInTheDocument()
  })

  test("renders desktop nav content", () => {
    const result = render(
      <BrowserRouter>
        <Nav>Hello, world!</Nav>
      </BrowserRouter>
    )

    expect(result.queryByTitle("Route Ladders")).not.toBeNull()
    expect(result.queryByText("Route Ladders")).not.toBeNull()
  })
})
