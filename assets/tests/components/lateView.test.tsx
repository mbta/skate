import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"

import App from "../../src/components/app"
import LateView from "../../src/components/lateView"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useVehicles from "../../src/hooks/useVehicles"
import { VehicleOrGhost } from "../../src/realtime"
import { ByRouteId } from "../../src/schedule"
import { initialState, toggleLateView } from "../../src/state"
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
    const state = { ...initialState, lateViewIsVisible: true }
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
})
