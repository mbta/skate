import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"

import App from "../../src/components/app"
import LateView from "../../src/components/lateView"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useVehicles from "../../src/hooks/useVehicles"
import { VehicleOrGhost } from "../../src/realtime"
import { ByRouteId } from "../../src/schedule"
import {
  initialState,
  OpenView,
  State,
  toggleLateView,
  selectVehicle,
} from "../../src/state"
import blockWaiverFactory from "../factories/blockWaiver"
import vehicleFactory from "../factories/vehicle"
import ghostFactory from "../factories/ghost"

jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.spyOn(Date, "now").mockImplementation(() => {
  return 18000 * 1000
})

describe("LateView", () => {
  test("renders missing logons and late buses", () => {
    ;(useVehicles as jest.Mock).mockImplementationOnce(
      (): ByRouteId<VehicleOrGhost[]> => ({
        ["route"]: [
          vehicleFactory.build({ routeId: "route", scheduleAdherenceSecs: 0 }),
          vehicleFactory.build({
            routeId: "route",
            scheduleAdherenceSecs: 901,
          }),
          vehicleFactory.build({
            routeId: "route",
            scheduleAdherenceSecs: 901,
            routeStatus: "laying_over",
          }),
          vehicleFactory.build({
            routeId: "route",
            scheduleAdherenceSecs: 901,
            blockWaivers: [blockWaiverFactory.build()],
          }),
          ghostFactory.build({
            routeId: "route",
            scheduledLogonTime: 15299,
            currentPieceFirstRoute: "route",
            currentPieceStartPlace: "garage",
          }),
          ghostFactory.build({
            routeId: "route",
            scheduledLogonTime: 15301,
            currentPieceFirstRoute: "route",
            currentPieceStartPlace: "station",
          }),
          ghostFactory.build({
            routeId: "route",
            scheduledLogonTime: 15302,
            currentPieceFirstRoute: "route",
            currentPieceStartPlace: "somewhere",
            blockWaivers: [blockWaiverFactory.build()],
          }),
        ],
      })
    )

    const tree = renderer.create(<LateView />)
    expect(tree).toMatchSnapshot()
  })

  test("clicking tab closes late view", () => {
    ;(useVehicles as jest.Mock).mockImplementation(() => {
      return {}
    })

    const mockDispatch = jest.fn()
    const state: State = { ...initialState, openView: OpenView.Late }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={mockDispatch}>
        <App />
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
      scheduledLogonTime: 15299,
      currentPieceFirstRoute: "route",
      currentPieceStartPlace: "garage",
    })

    ;(useVehicles as jest.Mock).mockImplementationOnce(
      (): ByRouteId<VehicleOrGhost[]> => ({
        route: [ghost],
      })
    )

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
        <LateView />
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

    ;(useVehicles as jest.Mock).mockImplementationOnce(
      (): ByRouteId<VehicleOrGhost[]> => ({
        route: [vehicle],
      })
    )

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
        <LateView />
      </StateDispatchProvider>
    )

    wrapper.find(".m-late-view__run-link").first().simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(selectVehicle(vehicle))

    expect(window.FS!.event).toHaveBeenCalledWith(
      "User selected late view run number"
    )
  })
})
