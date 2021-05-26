import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import SearchPage from "../../src/components/searchPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSearchResults from "../../src/hooks/useSearchResults"
import { Ghost, Vehicle, VehicleOrGhost } from "../../src/realtime"
import { initialState, State } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

import vehicleFactory from "../factories/vehicle"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

const vehicle: Vehicle = vehicleFactory.build()

const ghost: Ghost = {
  id: "ghost-trip",
  directionId: 0,
  routeId: "39",
  tripId: "trip",
  headsign: "headsign",
  blockId: "block",
  runId: "123-0123",
  viaVariant: "X",
  layoverDepartureTime: null,
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
  routeStatus: "on_route",
  blockWaivers: [],
}
jest.mock("../../src/hooks/useSearchResults", () => ({
  __esModule: true,
  default: jest.fn(),
}))

describe("SearchPage", () => {
  test("renders the empty state", () => {
    ;(useSearchResults as jest.Mock).mockImplementationOnce(() => null)
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
          <SearchPage />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders vehicle data", () => {
    const searchResults: VehicleOrGhost[] = [vehicle, ghost]
    ;(useSearchResults as jest.Mock).mockImplementation(() => searchResults)
    const tree = renderer
      .create(
        <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
          <SearchPage />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a selected vehicle", () => {
    const selectedVehicleState: State = {
      ...initialState,
      selectedVehicleOrGhost: vehicle,
    }

    const tree = renderer
      .create(
        <StateDispatchProvider
          state={selectedVehicleState}
          dispatch={jest.fn()}
        >
          <SearchPage />
        </StateDispatchProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("on mobile, shows the results list initially", () => {
    const wrapper = mount(<SearchPage />)

    expect(wrapper.exists(".m-search-page--show-list")).toBeTruthy()
  })

  test("on mobile, allows you to toggle to the map view and back again", () => {
    const wrapper = mount(<SearchPage />)

    wrapper
      .find(".m-search-page__toggle-mobile-display-button")
      .simulate("click")

    expect(wrapper.exists(".m-search-page--show-map")).toBeTruthy()

    wrapper
      .find(".m-search-page__toggle-mobile-display-button")
      .simulate("click")

    expect(wrapper.exists(".m-search-page--show-list")).toBeTruthy()
  })
})
