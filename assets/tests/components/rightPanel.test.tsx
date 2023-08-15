import { jest, describe, test, expect } from "@jest/globals"
import { render } from "@testing-library/react"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom/jest-globals"
import renderer from "react-test-renderer"
import RightPanel from "../../src/components/rightPanel"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState, State, OpenView } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

import ghostFactory from "../factories/ghost"
import vehicleFactory from "../factories/vehicle"
import stateFactory from "../factories/applicationState"
import { RunFactory } from "../factories/run"

const ghost = ghostFactory.build({ runId: "ghostrun-1" })
const vehicle = vehicleFactory.build()

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(() => true),
}))

describe("rightPanel", () => {
  test("shows nothing if nothing is selected", () => {
    const tree = renderer
      .create(
        <BrowserRouter>
          <RightPanel />
        </BrowserRouter>
      )
      .toJSON()
    expect(tree).toEqual(null)
  })

  test("shows a selected vehicle", () => {
    const { id: runId } = RunFactory.build()
    const vehicle = vehicleFactory.build({ runId })
    const state = stateFactory.build({ selectedVehicleOrGhost: vehicle })

    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel selectedVehicleOrGhost={vehicle} />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.queryByRole("button", { name: vehicle.runId! })).toBeVisible()
  })

  test("shows a selected ghost", () => {
    const state: State = { ...initialState, selectedVehicleOrGhost: ghost }
    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel selectedVehicleOrGhost={ghost} />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.queryByText(ghost.runId!)).toBeVisible()
  })

  test("shows notification drawer", () => {
    const state: State = {
      ...initialState,
      openView: OpenView.NotificationDrawer,
    }
    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.getByText("Notifications")).toBeVisible()
  })

  test("prefers VPP to notification drawer", () => {
    const state: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle,
      openView: OpenView.NotificationDrawer,
    }
    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel selectedVehicleOrGhost={vehicle} />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.queryByText("Vehicles")).toBeVisible()
    expect(result.queryByText("Notifications")).toBeNull()
  })

  test("shows swings view", () => {
    const state: State = { ...initialState, openView: OpenView.Swings }
    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.queryByText("Swings")).toBeVisible()
  })

  test("prefers VPP to swings view", () => {
    const state: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle,
      openView: OpenView.Swings,
    }
    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel selectedVehicleOrGhost={vehicle} />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.queryByText("Vehicles")).toBeVisible()
    expect(result.queryByText("Swings")).toBeNull()
  })
})
