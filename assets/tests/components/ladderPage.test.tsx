import React from "react"
import renderer from "react-test-renderer"
import { render, fireEvent, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { BrowserRouter } from "react-router-dom"
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
import { tagManagerEvent } from "../../src/helpers/googleTagManager"
import ghostFactory from "../factories/ghost"
import routeFactory from "../factories/route"
import routeTabFactory from "../factories/routeTab"
import userEvent from "@testing-library/user-event"

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
jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

const mockDispatch = jest.fn()

describe("LadderPage", () => {
  test("renders the empty state", () => {
    const tree = renderer
      .create(
        <BrowserRouter>
          <LadderPage />
        </BrowserRouter>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with route tabs", () => {
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
          <BrowserRouter>
            <RoutesProvider routes={routes}>
              <LadderPage />
            </RoutesProvider>
          </BrowserRouter>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("can select a different route tab by clicking", async () => {
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          ordering: 0,
          isCurrentTab: true,
          selectedRouteIds: ["1"],
          presetName: "Tab 1",
        }),
        routeTabFactory.build({
          ordering: 1,
          isCurrentTab: false,
          selectedRouteIds: ["39"],
          presetName: "Tab 2",
        }),
      ],
    }
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByText("Tab 2"))

    expect(mockDispatch).toHaveBeenCalledWith(
      selectRouteTab(mockState.routeTabs[1].uuid)
    )
  })

  test("can select a different route tab by key press", () => {
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
          presetName: "My Preset",
        }),
      ],
    }
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    fireEvent.keyDown(result.getByText("My Preset"), { key: "Enter" })

    expect(mockDispatch).toHaveBeenCalledWith(
      selectRouteTab(mockState.routeTabs[1].uuid)
    )
  })

  test("can close a route tab", async () => {
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

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    const tabElement = result.getByRole("tab")
    await user.click(within(tabElement).getByTitle("Close"))

    expect(mockDispatch).toHaveBeenCalledWith(
      closeRouteTab(mockState.routeTabs[0].uuid)
    )
  })

  test("can save a route tab as a preset from the save icon", async () => {
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
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByTitle("Save"))

    expect(mockDispatch).toHaveBeenCalledWith(
      promptToSaveOrCreatePreset(mockState.routeTabs[0])
    )
    expect(tagManagerEvent).toHaveBeenCalledWith("preset_saved")
  })

  test("can save an edited preset from the save icon", async () => {
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
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByTitle("Save"))

    expect(mockDispatch).toHaveBeenCalledWith(
      promptToSaveOrCreatePreset(mockState.routeTabs[1])
    )
  })

  test("omits save icon for unedited preset", () => {
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
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(result.queryByTitle("Save")).toBeNull()
  })

  test("can add a new route tab", async () => {
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
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByTitle("Add Tab"))

    expect(mockDispatch).toHaveBeenCalledWith(createRouteTab())
    expect(tagManagerEvent).toHaveBeenCalledWith("new_tab_added")
  })

  test("can toggle to presets view in picker and back", async () => {
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
    const result = render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(result.getByRole("button", { name: "Presets" }))

    expect(result.queryByText("Save as preset")).toBeVisible()

    await userEvent.click(result.getByRole("button", { name: "Routes" }))

    expect(result.getByPlaceholderText("Search routes")).toBeVisible()
  })

  test("creates a blank route tab if no route tabs are present", () => {
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

    render(
      <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
        <BrowserRouter>
          <RoutesProvider routes={routes}>
            <LadderPage />
          </RoutesProvider>
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(mockDispatch).toHaveBeenCalledWith(createRouteTab())
  })

  test("renders with selectedRoutes in different order than routes data", () => {
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          selectedRouteIds: ["28", "1"],
          ordering: 0,
          isCurrentTab: true,
        }),
      ],
    }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <BrowserRouter>
            <RoutesProvider routes={routes}>
              <LadderPage />
            </RoutesProvider>
          </BrowserRouter>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with timepoints", () => {
    const mockState = {
      ...initialState,
      routeTabs: [
        routeTabFactory.build({
          selectedRouteIds: ["28", "1"],
          ordering: 0,
          isCurrentTab: true,
        }),
      ],
    }
    ;(useTimepoints as jest.Mock).mockImplementationOnce(
      () => timepointsByRouteId
    )
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <BrowserRouter>
            <RoutesProvider routes={routes}>
              <LadderPage />
            </RoutesProvider>
          </BrowserRouter>
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
      routeTabs: [
        routeTabFactory.build({
          selectedRouteIds: ["1"],
          ordering: 0,
          isCurrentTab: true,
        }),
      ],
      selectedVehicleOrGhost: vehicle,
    }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <BrowserRouter>
            <RoutesProvider routes={routes}>
              <LadderPage />
            </RoutesProvider>
          </BrowserRouter>
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("if a vehicle from a notification is loading, show nothing", () => {
    const notification: Notification = { runIds: ["run_id"] } as Notification
    const state: State = {
      ...initialState,
      selectedNotification: notification,
    }
    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <LadderPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.queryByText("Vehicles")).toBeNull()
  })

  test("if a vehicle from a notification failed to load, show nothing", () => {
    const notification: Notification = { runIds: ["run_id"] } as Notification
    const state: State = {
      ...initialState,
      selectedNotification: notification,
    }
    const result = render(
      <StateDispatchProvider state={state} dispatch={jest.fn()}>
        <BrowserRouter>
          <LadderPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.queryByText("Vehicles")).toBeNull()
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
