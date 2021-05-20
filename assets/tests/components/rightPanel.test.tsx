import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import RightPanel from "../../src/components/rightPanel"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { initialState, State } from "../../src/state"
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
    const tree = renderer.create(<RightPanel />).toJSON()
    expect(tree).toEqual(null)
  })

  test("shows a selected vehicle", () => {
    const state: State = { ...initialState, selectedVehicleOrGhost: vehicle }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <RightPanel selectedVehicleOrGhost={vehicle} />
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain(vehicle.runId)
  })

  test("shows a selected ghost", () => {
    const state: State = { ...initialState, selectedVehicleOrGhost: ghost }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <RightPanel selectedVehicleOrGhost={ghost} />
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain(ghost.runId)
  })

  test("shows notification drawer", () => {
    const state: State = { ...initialState, notificationDrawerIsOpen: true }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <RightPanel />
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
        <RightPanel selectedVehicleOrGhost={vehicle} />
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain("m-vehicle-properties-panel")
    expect(wrapper.html()).not.toContain("m-notification-drawer")
  })

  test("shows swings view", () => {
    const state: State = { ...initialState, swingsViewIsVisible: true }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <RightPanel />
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain("Swings view")
  })

  test("prefers VPP to swings view", () => {
    const state: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle,
      swingsViewIsVisible: true,
    }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <RightPanel selectedVehicleOrGhost={vehicle} />
      </StateDispatchProvider>
    )
    expect(wrapper.html()).toContain("m-vehicle-properties-panel")
    expect(wrapper.html()).not.toContain("Swings view")
  })
})
