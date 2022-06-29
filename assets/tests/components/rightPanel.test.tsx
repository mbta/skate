import { mount } from "enzyme"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import renderer from "react-test-renderer"
import RightPanel from "../../src/components/rightPanel"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState, State, OpenView } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

import ghostFactory from "../factories/ghost"
import vehicleFactory from "../factories/vehicle"

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
    const state: State = { ...initialState, selectedVehicleOrGhost: vehicle }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel selectedVehicleOrGhost={vehicle} />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain(vehicle.runId)
  })

  test("shows a selected ghost", () => {
    const state: State = { ...initialState, selectedVehicleOrGhost: ghost }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel selectedVehicleOrGhost={ghost} />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain(ghost.runId)
  })

  test("shows notification drawer", () => {
    const state: State = { ...initialState, notificationDrawerIsOpen: true }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain("m-notification-drawer")
  })

  test("prefers VPP to notification drawer", () => {
    const state: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle,
      notificationDrawerIsOpen: true,
    }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel selectedVehicleOrGhost={vehicle} />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain("m-vehicle-properties-panel")
    expect(wrapper.html()).not.toContain("m-notification-drawer")
  })

  test("shows swings view", () => {
    const state: State = { ...initialState, openView: OpenView.Swings }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain("Swings view")
  })

  test("prefers VPP to swings view", () => {
    const state: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle,
      openView: OpenView.Swings,
    }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <RightPanel selectedVehicleOrGhost={vehicle} />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain("m-vehicle-properties-panel")
    expect(wrapper.html()).not.toContain("Swings view")
  })
})
