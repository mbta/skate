import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import LadderPage, {
  findRouteById,
  findSelectedVehicleOrGhost,
} from "../../src/components/ladderPage"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useTimepoints from "../../src/hooks/useTimepoints"
import useVehicles from "../../src/hooks/useVehicles"
import {
  Ghost,
  Notification,
  Vehicle,
  VehicleOrGhost,
} from "../../src/realtime"
import { ByRouteId, Route, TimepointsByRouteId } from "../../src/schedule.d"
import {
  initialState,
  State,
  selectRouteTab,
  createRouteTab,
  closeRouteTab,
  promptToSaveOrCreatePreset,
} from "../../src/state"
import ghostFactory from "../factories/ghost"
import routeFactory from "../factories/route"
import routeTabFactory from "../factories/routeTab"
import featureIsEnabled from "../../src/laboratoryFeatures"

jest.mock("../../src/hooks/useTimepoints", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))
jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))
jest.mock("../../src/hooks/useVehicleForNotification", () => ({
  __esModule: true,
  default: jest.fn(() => undefined),
}))
jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

const mockDispatch = jest.fn()

describe("LadderPage", () => {
  test("renders the empty state", () => {
    const tree = renderer.create(<LadderPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with routes", () => {
    const mockState = { ...initialState, selectedRouteIds: ["1"] }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with route tabs", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
        }),
        routeTabFactory.build({
          ordering: undefined,
          isCurrentTab: false,
          selectedRouteIds: ["28"],
        }),
        routeTabFactory.build({
          ordering: 1,
          isCurrentTab: false,
          selectedRouteIds: ["39"],
        }),
      ],
    }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("can select a different route tab", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
        }),
        routeTabFactory.build({
          ordering: 1,
          isCurrentTab: false,
          selectedRouteIds: ["39"],
        }),
      ],
    }
    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <RoutesProvider routes={routes}>
          <LadderPage />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    wrapper
      .find(".m-ladder-page__tab:not(.m-ladder-page__tab-current)")
      .simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(
      selectRouteTab(mockState.routeTabs[1].uuid)
    )
  })

  test("can close a route tab", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
        }),
      ],
    }
    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <RoutesProvider routes={routes}>
          <LadderPage />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-ladder-page__tab-contents button").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(
      closeRouteTab(mockState.routeTabs[0].uuid)
    )
  })

  test("can save a route tab as a preset from the save icon", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
        }),
      ],
    }
    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <RoutesProvider routes={routes}>
          <LadderPage />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-ladder-page__tab-save-icon").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(
      promptToSaveOrCreatePreset(mockState.routeTabs[0])
    )
  })

  test("can save an edited preset from the save icon", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          uuid: "uuid1",
          ordering: undefined,
          isCurrentTab: false,
          selectedRouteIds: ["1"],
        }),
        routeTabFactory.build({
          uuid: "uuid2",
          ordering: 0,
          isCurrentTab: true,
          presetName: "My Preset",
          selectedRouteIds: ["1", "7"],
          saveChangesToTabUuid: "uuid1",
        }),
      ],
    }
    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <RoutesProvider routes={routes}>
          <LadderPage />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-ladder-page__tab-save-icon").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(
      promptToSaveOrCreatePreset(mockState.routeTabs[1])
    )
  })

  test("omits save icon for unedited preset", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
          presetName: "My Preset",
          saveChangesToTabUuid: undefined,
        }),
      ],
    }
    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <RoutesProvider routes={routes}>
          <LadderPage />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    expect(wrapper.find(".m-ladder-page__tab-save-icon").length).toBe(0)
  })

  test("can add a new route tab", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
        }),
      ],
    }
    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <RoutesProvider routes={routes}>
          <LadderPage />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    wrapper.find(".m-ladder-page__add-tab-button").simulate("click")

    expect(mockDispatch).toHaveBeenCalledWith(createRouteTab())
  })

  test("can toggle to presets view in picker and back", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
          presetName: "My Preset",
        }),
      ],
    }
    const wrapper = mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <RoutesProvider routes={routes}>
          <LadderPage />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    wrapper.find("#m-ladder-page__presets_picker_button").simulate("click")

    expect(wrapper.find(".m-presets-panel").length).toBe(1)

    wrapper.find("#m-ladder-page__routes_picker_button").simulate("click")

    expect(wrapper.find(".m-presets-panel").length).toBe(0)
  })

  test("creates a blank route tab if no route tabs are present", () => {
    ;(featureIsEnabled as jest.Mock).mockImplementationOnce(() => true)
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: undefined,
          isCurrentTab: false,
          selectedRouteIds: ["1"],
          presetName: "My Preset",
        }),
      ],
    }

    mount(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <RoutesProvider routes={routes}>
          <LadderPage />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    expect(mockDispatch).toHaveBeenCalledWith(createRouteTab())
  })

  test("renders with selectedRoutes in different order than routes data", () => {
    const mockState = { ...initialState, selectedRouteIds: ["28", "1"] }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with timepoints", () => {
    const mockState = { ...initialState, selectedRouteIds: ["28", "1"] }
    ;(useTimepoints as jest.Mock).mockImplementationOnce(
      () => timepointsByRouteId
    )
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with vehicles and selected vehicles", () => {
    const vehicle: VehicleOrGhost = ghostFactory.build({
      id: "ghost-id",
      directionId: 0,
      routeId: "1",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: null,
      viaVariant: null,
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "hhgat",
        fractionUntilTimepoint: 0.0,
      },
      scheduledLogonTime: null,
      routeStatus: "on_route",
      blockWaivers: [],
    })
    ;(useVehicles as jest.Mock).mockImplementationOnce(() => ({
      ["1"]: [vehicle],
    }))
    const mockState = {
      ...initialState,
      selectedRouteIds: ["1"],
      selectedVehicleOrGhost: vehicle,
    }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("if a vehicle from a notification is loading, show nothing", () => {
    const notification: Notification = { runIds: ["run_id"] } as Notification
    const state: State = { ...initialState, selectedNotification: notification }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <LadderPage />
      </StateDispatchProvider>
    )
    expect(wrapper.find("#m-properties-panel").exists()).toBeFalsy()
  })

  test("if a vehicle from a notification failed to load, show nothing", () => {
    const notification: Notification = { runIds: ["run_id"] } as Notification
    const state: State = { ...initialState, selectedNotification: notification }
    const wrapper = mount(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <LadderPage />
      </StateDispatchProvider>
    )
    expect(wrapper.find("#m-properties-panel").exists()).toBeFalsy()
  })
})

describe("findRouteById", () => {
  test("finds a route in a list by its id", () => {
    expect(findRouteById(routes, "28")).toEqual(
      routeFactory.build({
        id: "28",
        name: "28",
      })
    )
  })

  test("returns undefined if the route isn't found", () => {
    expect(findRouteById(routes, "missing")).toEqual(undefined)
  })

  test("returns undefined if routes is null", () => {
    expect(findRouteById(null, "does not matter")).toEqual(undefined)
  })
})

describe("findSelectedVehicleOrGhost", () => {
  test("returns the requested vehicle if it is on the route", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "on-route-39")
    ).toEqual({
      id: "on-route-39",
      routeStatus: "on_route",
    })
  })

  test("returns the requested vehicle if it is pulling out", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "pulling-out-39")
    ).toEqual({
      id: "pulling-out-39",
      routeStatus: "pulling_out",
    })
  })

  test("returns the requested vehicle if it is a ghost bus", () => {
    expect(findSelectedVehicleOrGhost(vehiclesByRouteId, "ghost-39")).toEqual({
      id: "ghost-39",
    })
  })

  test("returns undefined if the vehicle is not found", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "missing-23")
    ).toBeUndefined()
  })

  test("returns undefined if selectedVehicleId is undefined", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, undefined)
    ).toBeUndefined()
  })
})

const routes: Route[] = [
  routeFactory.build({ id: "1", name: "1" }),
  routeFactory.build({ id: "28", name: "28" }),
]
const timepointsByRouteId: TimepointsByRouteId = {
  "1": [
    { id: "WASMA", name: "WASMA Name" },
    { id: "MELWA", name: "MELWA Name" },
    { id: "HHGAT", name: "HHGAT Name" },
  ],
  "28": [
    { id: "MATPN", name: "MATPN Name" },
    { id: "WELLH", name: "WELLH Name" },
    { id: "MORTN", name: "MORTN Name" },
  ],
  "71": undefined,
  "73": null,
}

const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = {
  "23": [
    {
      id: "on-route-23",
      routeStatus: "on_route",
    } as Vehicle,
    {
      id: "pulling-out-23",
      routeStatus: "pulling_out",
    } as Vehicle,
    {
      id: "ghost-23",
    } as Ghost,
  ],
  "39": [
    {
      id: "on-route-39",
      routeStatus: "on_route",
    } as Vehicle,
    {
      id: "pulling-out-39",
      routeStatus: "pulling_out",
    } as Vehicle,
    {
      id: "ghost-39",
    } as Ghost,
  ],
}
