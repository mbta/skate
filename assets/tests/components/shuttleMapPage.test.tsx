import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals"
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import { BrowserRouter } from "react-router-dom"
import ShuttleMapPage, {
  allTrainVehicles,
} from "../../src/components/shuttleMapPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { useRouteShapes, useTripShape } from "../../src/hooks/useShapes"
import useShuttleVehicles from "../../src/hooks/useShuttleVehicles"
import useTrainVehicles from "../../src/hooks/useTrainVehicles"
import { TrainVehicle, VehicleInScheduledService } from "../../src/realtime"
import { ByRouteId, Shape } from "../../src/schedule"
import { initialState } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"
import { shuttleFactory } from "../factories/vehicle"
import userEvent from "@testing-library/user-event"
import shapeFactory from "../factories/shape"
import {
  layersControlButton,
  zoomInButton,
  zoomOutButton,
} from "../testHelpers/selectors/components/map"
import { mockTileUrls } from "../testHelpers/mockHelpers"
import { RealDispatchWrapper } from "../testHelpers/wrappers"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)
jest.mock("../../src/hooks/useShuttleRoutes", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))
jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useRouteShapes: jest.fn(() => []),
  useTripShape: jest.fn(() => []),
}))
jest.mock("../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))
jest.mock("../../src/hooks/useShuttleVehicles", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))
jest.mock("../../src/hooks/useTrainVehicles", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))

jest.mock("../../src/tilesetUrls", () => ({
  __esModule: true,
  tilesetUrlForType: jest.fn(() => null),
}))

beforeAll(() => {
  mockTileUrls()
})

const originalScrollTo = global.scrollTo
// Clicking/moving map calls scrollTo under the hood
jest.spyOn(global, "scrollTo").mockImplementation(jest.fn())

afterAll(() => {
  global.scrollTo = originalScrollTo
})

const shuttle: VehicleInScheduledService = shuttleFactory.build({
  label: "1818",
})

const shape: Shape = shapeFactory.build({
  points: [],
  stops: [],
})

describe("Shuttle Map Page", () => {
  test("renders", () => {
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const result = render(
      <BrowserRouter>
        <ShuttleMapPage />
      </BrowserRouter>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("Has the layers control", () => {
    render(
      <BrowserRouter>
        <ShuttleMapPage />
      </BrowserRouter>
    )
    expect(layersControlButton.get()).toBeInTheDocument()
  })

  // TODO: based on the snapshot, this test does not appear to be correctly testing
  // the intended functionality
  test("renders with shapes selected", () => {
    ;(useRouteShapes as jest.Mock).mockImplementationOnce(() => [shape])
    ;(useTripShape as jest.Mock).mockImplementationOnce(() => [shape])
    const result = render(
      <BrowserRouter>
        <ShuttleMapPage />
      </BrowserRouter>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("renders with train vehicles", () => {
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const trainVehicle: TrainVehicle = {
      id: "R-5463D2D3",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15,
    }
    ;(useTrainVehicles as jest.Mock).mockImplementationOnce(() => ({
      [trainVehicle.id]: trainVehicle,
    }))

    const result = render(
      <BrowserRouter>
        <ShuttleMapPage />
      </BrowserRouter>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("renders selected shuttle routes", () => {
    const dispatch = jest.fn()
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: [shuttle.runId!] }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <ShuttleMapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("renders with all shuttles selected", () => {
    const dispatch = jest.fn()
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: "all" }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <ShuttleMapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("changing selected shuttles re-enabled map centering", async () => {
    const dispatch = jest.fn()
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: "all" }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <ShuttleMapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    await animationFramePromise()

    // We can't directly use the recenter button to disable recentering, but zooming works.
    // However, there is currently a bug causing us to not disable autocentering with a single
    // click on one of the zoom buttons, instead requiring two.
    await userEvent.click(zoomInButton.get())
    await animationFramePromise()
    await userEvent.click(zoomOutButton.get())
    await animationFramePromise()

    result.rerender(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: ["shuttle run"] }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <ShuttleMapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    expect(
      result.container.getElementsByClassName(
        "c-vehicle-map-state--auto-centering"
      ).length
    ).toBe(1)
  })

  test("clicking a shuttle on the map dispatches select event", async () => {
    const label = "clickMe"
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [
      { ...shuttle, label: label },
    ])
    const mockDispatch = jest.fn()
    render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: "all" }}
        dispatch={mockDispatch}
      >
        <BrowserRouter>
          <ShuttleMapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )

    await userEvent.click(screen.getByText(label))
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SELECT_VEHICLE" })
    )
  })
})

describe("allTrainVehicles", () => {
  test("returns all train vehicles in a single list", () => {
    const trainVehicle: TrainVehicle = {
      id: "R-5463D2D3",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15,
    }
    const trainVehiclesByRouteId: ByRouteId<TrainVehicle[]> = {
      Red: [trainVehicle],
    }

    expect(allTrainVehicles(trainVehiclesByRouteId)).toEqual([trainVehicle])
  })
})

describe("Map controls", () => {
  test("Can change tile layer to satellite", async () => {
    const { container } = render(
      <RealDispatchWrapper>
        <ShuttleMapPage />
      </RealDispatchWrapper>
    )

    await userEvent.click(layersControlButton.get())

    await userEvent.click(screen.getByLabelText("Satellite"))

    expect(
      container.querySelector("img[src^=test_satellite_url")
    ).not.toBeNull()
  })
})

const animationFramePromise = (): Promise<null> => {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve(null))
  })
}
