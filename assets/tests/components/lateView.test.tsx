import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"

import App from "../../src/components/app"
import LateView from "../../src/components/lateView"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { VehiclesByRouteIdProvider } from "../../src/contexts/vehiclesByRouteIdContext"
import {
  initialState,
  OpenView,
  State,
  selectVehicle,
  toggleLateView,
} from "../../src/state"
import blockWaiverFactory from "../factories/blockWaiver"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"

jest.spyOn(Date, "now").mockImplementation(() => {
  return 18000 * 1000
})

describe("LateView", () => {
  test("renders missing logons and late buses", () => {
    const vehiclesByRouteId = {
      route: [
        vehicleFactory.build({
          routeId: "route",
          runId: "run1",
          scheduleAdherenceSecs: 0,
        }),
        vehicleFactory.build({
          routeId: "route",
          runId: "run2",
          scheduleAdherenceSecs: 901,
        }),
        vehicleFactory.build({
          routeId: "other_route",
          runId: "run2",
          scheduleAdherenceSecs: 901,
        }),
        vehicleFactory.build({
          routeId: "route",
          runId: "run3",
          scheduleAdherenceSecs: 901,
          routeStatus: "laying_over",
        }),
        vehicleFactory.build({
          routeId: "route",
          runId: "run4",
          scheduleAdherenceSecs: 901,
          blockWaivers: [blockWaiverFactory.build()],
        }),
        ghostFactory.build({
          routeId: "route",
          runId: "run5",
          scheduledLogonTime: 15299,
          currentPieceFirstRoute: "route",
          currentPieceStartPlace: "garage",
        }),
        ghostFactory.build({
          routeId: "route",
          runId: "run6",
          scheduledLogonTime: 15301,
          currentPieceFirstRoute: "route",
          currentPieceStartPlace: "station",
        }),
        ghostFactory.build({
          routeId: "route",
          runId: "run7",
          scheduledLogonTime: 15302,
          currentPieceFirstRoute: "route",
          currentPieceStartPlace: "somewhere",
          blockWaivers: [blockWaiverFactory.build()],
        }),
      ],
    }

    const tree = renderer.create(
      <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
        <LateView />
      </VehiclesByRouteIdProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("clicking tab closes late view", () => {
    const mockDispatch = jest.fn()
    const state: State = { ...initialState, openView: OpenView.Late }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{}}>
          <App />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )
    expect(wrapper.find(".m-late-view"))

    wrapper
      .find(".m-late-view .c-drawer-tab__tab-button")
      .first()
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(toggleLateView())
  })

  test("clicking ghost run number opens ghost and sends Fullstory event", () => {
    const ghost = ghostFactory.build({
      routeId: "route",
      runId: "12345",
      scheduledLogonTime: 15299,
      currentPieceFirstRoute: "route",
      currentPieceStartPlace: "garage",
    })

    const originalFS = window.FS
    const originalUsername = window.username
    window.FS = { event: jest.fn(), identify: jest.fn() }

    afterEach(() => {
      window.FS = originalFS
      window.username = originalUsername
    })

    const mockDispatch = jest.fn()
    const state: State = { ...initialState, openView: OpenView.Late }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{ route: [ghost] }}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-late-view__run-link").first().simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(ghost))

    expect(window.FS!.event).toHaveBeenCalledWith(
      "User selected late view run number - ghost bus"
    )
  })

  test("clicking vehicle run number opens vehicle and sends Fullstory event", () => {
    const vehicle = vehicleFactory.build({
      routeId: "route",
      scheduleAdherenceSecs: 901,
    })

    const originalFS = window.FS
    const originalUsername = window.username
    window.FS = { event: jest.fn(), identify: jest.fn() }

    afterEach(() => {
      window.FS = originalFS
      window.username = originalUsername
    })

    const mockDispatch = jest.fn()
    const state: State = { ...initialState, openView: OpenView.Late }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <VehiclesByRouteIdProvider vehiclesByRouteId={{ route: [vehicle] }}>
          <LateView />
        </VehiclesByRouteIdProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-late-view__run-link").first().simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle))

    expect(window.FS!.event).toHaveBeenCalledWith(
      "User selected late view run number"
    )
  })
})
