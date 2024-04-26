import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import renderer from "react-test-renderer"
import ghostFactory from "../factories/ghost"
import vehicleFactory from "../factories/vehicle"
import routeFactory from "../factories/route"
import swingFactory from "../factories/swing"
import SwingsView from "../../src/components/swingsView"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useSwings from "../../src/hooks/useSwings"
import useVehiclesForRunIds from "../../src/hooks/useVehiclesForRunIds"
import useVehiclesForBlockIds from "../../src/hooks/useVehiclesForBlockIds"
import { Route, Swing } from "../../src/schedule"
import {
  initialState,
  rememberSwingsViewScrollPosition,
  toggleShowHidePastSwings,
} from "../../src/state"
import { VehicleInScheduledService, Ghost } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"
import { runIdToLabel } from "../../src/helpers/vehicleLabel"
import userEvent from "@testing-library/user-event"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"
import { fullStoryEvent } from "../../src/helpers/fullStory"
import { mockUsePanelState } from "../testHelpers/usePanelStateMocks"

jest.mock("../../src/hooks/usePanelState")

jest.mock("../../src/hooks/useSwings", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../src/hooks/useVehiclesForRunIds", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../src/hooks/useVehiclesForBlockIds", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

jest.mock("../../src/helpers/fullStory")

jest.spyOn(dateTime, "now").mockImplementation(() => {
  return new Date(18000 * 1000)
})

beforeEach(() => {
  mockUsePanelState()
})

const vehicle: VehicleInScheduledService = vehicleFactory.build({
  runId: "123-456",
  blockId: "A12-34",
})

const ghost: Ghost = ghostFactory.build({ runId: "124-456" })

const routes: Route[] = [
  routeFactory.build({
    id: "1",
    name: "Name 1",
    directionNames: {
      0: "Someplace",
      1: "Some Otherplace",
    },
  }),
  routeFactory.build({
    id: "2",
    name: "Name 3",
    directionNames: {
      0: "Someplace",
      1: "Some Otherplace",
    },
  }),
  routeFactory.build({
    id: "3",
    name: "Name 3",
    directionNames: {
      0: "Someplace",
      1: "Some Otherplace",
    },
  }),
]

describe("SwingsView", () => {
  test("renders loading message", () => {
    ;jest.mocked(useSwings).mockImplementationOnce(() => null)
    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("omits swings more than 15 minutes in the past", () => {
    ;jest.mocked(useSwings).mockImplementationOnce((): Swing[] => [
      swingFactory.build({ time: 18000 - 900 }),
    ])

    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("includes swings less than 15 minutes in the past", () => {
    ;jest.mocked(useSwings).mockImplementationOnce((): Swing[] => [
      swingFactory.build({ time: 18000 - 900 + 1 }),
    ])

    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("can click to show / hide past swings", async () => {
    const swing = swingFactory.build({ time: 1000, fromRunId: "123-4567" })
    ;jest.mocked(useSwings)
      .mockImplementationOnce((): Swing[] => [swing])
      .mockImplementationOnce((): Swing[] => [swing])

    const dispatch = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await user.click(result.getByText("Show past swings"))

    expect(dispatch).toHaveBeenCalledWith(toggleShowHidePastSwings())
  })

  test("shows past swings", async () => {
    const swing = swingFactory.build({ time: 1000, fromRunId: "123-4567" })
    ;jest.mocked(useSwings)
      .mockImplementationOnce((): Swing[] => [swing])
      .mockImplementationOnce((): Swing[] => [swing])

    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, showPastSwings: true }}
        dispatch={dispatch}
      >
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    expect(result.queryByText("4567")).toBeVisible()
  })

  test("hides past swings", async () => {
    const swing = swingFactory.build({ time: 1000, fromRunId: "123-4567" })
    ;jest.mocked(useSwings)
      .mockImplementationOnce((): Swing[] => [swing])
      .mockImplementationOnce((): Swing[] => [swing])

    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, showPastSwings: false }}
        dispatch={dispatch}
      >
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    expect(result.queryByText("4567")).toBeNull()
  })

  test("renders future swings, active and inactive", () => {
    ;jest.mocked(useSwings).mockImplementationOnce((): Swing[] => [
      swingFactory.build({ time: 19000 }),
      swingFactory.build({
        blockId: "B12-34",
        fromRouteId: "2",
        fromRunId: "124-456",
        fromTripId: "1235",
        toRouteId: "2",
        toRunId: "124-789",
        toTripId: "5679",
        time: 20000,
      }),
      swingFactory.build({
        blockId: "C12-34",
        fromRouteId: "3",
        fromRunId: "125-456",
        fromTripId: "1236",
        toRouteId: "3",
        toRunId: "125-789",
        toTripId: "5680",
        time: 21000,
      }),
    ])
    ;jest.mocked(useVehiclesForRunIds).mockImplementationOnce(
      (): (VehicleInScheduledService | Ghost)[] => [vehicle, ghost]
    )
    ;jest.mocked(useVehiclesForBlockIds).mockImplementationOnce(
      (): (VehicleInScheduledService | Ghost)[] => [vehicle]
    )

    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("ignores vehicles without run ID (for linking to VPP)", () => {
    ;jest.mocked(useSwings).mockImplementationOnce((): Swing[] => [
      swingFactory.build({ time: 19000 }),
    ])
    ;jest.mocked(useVehiclesForRunIds).mockImplementationOnce(
      (): (VehicleInScheduledService | Ghost)[] => [{ ...vehicle, runId: null }]
    )
    ;jest.mocked(useVehiclesForBlockIds).mockImplementationOnce(
      (): (VehicleInScheduledService | Ghost)[] => [{ ...vehicle, runId: null }]
    )

    const tree = renderer
      .create(
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("opens VPP when clicking an active swing-off and sends Fullstory event", async () => {
    const mockedUsePanelState = mockUsePanelState()
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    const swing = swingFactory.build({ time: 19000 })
    jest
      .mocked(useSwings)
      .mockReturnValueOnce([swing])
      .mockReturnValueOnce([swing])
    jest
      .mocked(useVehiclesForRunIds)
      .mockReturnValueOnce([vehicle])
      .mockReturnValueOnce([vehicle])
    jest
      .mocked(useVehiclesForBlockIds)
      .mockReturnValueOnce([vehicle])
      .mockReturnValueOnce([vehicle])

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await user.click(result.getByText(runIdToLabel(vehicle.runId)))

    expect(
      mockedUsePanelState().openVehiclePropertiesPanel
    ).toHaveBeenCalledWith(vehicle)
    expect(tagManagerEvent).toHaveBeenCalledWith("clicked_swing_off")
    expect(mockedFSEvent).toHaveBeenCalledWith(
      'User clicked "Swing Off" run button',
      {}
    )
  })

  test("opens VPP when clicking an active swing-on and sends Fullstory event", async () => {
    const mockedFSEvent = jest.mocked(fullStoryEvent)
    const swing = swingFactory.build({
      fromRunId: "123-789",
      toRunId: "123-456",
      time: 19000,
    })
    ;jest.mocked(useSwings)
      .mockImplementationOnce((): Swing[] => [swing])
      .mockImplementationOnce((): Swing[] => [swing])
    ;jest.mocked(useVehiclesForRunIds)
      .mockImplementationOnce((): (VehicleInScheduledService | Ghost)[] => [
        vehicle,
      ])
      .mockImplementationOnce((): (VehicleInScheduledService | Ghost)[] => [
        vehicle,
      ])
    ;jest.mocked(useVehiclesForBlockIds)
      .mockImplementationOnce((): (VehicleInScheduledService | Ghost)[] => [
        vehicle,
      ])
      .mockImplementationOnce((): (VehicleInScheduledService | Ghost)[] => [
        vehicle,
      ])

    const mockedUsePanelState = mockUsePanelState()
    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await user.click(result.getByText(runIdToLabel(vehicle.runId)))

    expect(
      mockedUsePanelState().openVehiclePropertiesPanel
    ).toHaveBeenCalledWith(vehicle)
    expect(tagManagerEvent).toHaveBeenCalledWith("clicked_swing_on")
    expect(mockedFSEvent).toHaveBeenCalledWith(
      'User clicked "Swing On" run button',
      {}
    )
  })

  test("links to both swing-on and swing-off if both are active", () => {
    ;jest.mocked(useSwings).mockImplementationOnce((): Swing[] => [
      swingFactory.build({ time: 19000 }),
    ])

    const vehicle2 = vehicleFactory.build({ runId: "123-789" })
    ;jest.mocked(useVehiclesForRunIds).mockImplementationOnce(
      (): (VehicleInScheduledService | Ghost)[] => [vehicle, vehicle2]
    )
    ;jest.mocked(useVehiclesForBlockIds).mockImplementationOnce(
      (): (VehicleInScheduledService | Ghost)[] => [vehicle]
    )

    const tree = renderer.create(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      </StateDispatchProvider>
    )
    expect(tree).toMatchSnapshot()
  })

  test("can close the swings view", async () => {
    ;jest.mocked(useSwings).mockImplementationOnce((): Swing[] => [
      swingFactory.build({ time: 19000 }),
    ])
    ;jest.mocked(useVehiclesForRunIds).mockImplementationOnce(
      (): (VehicleInScheduledService | Ghost)[] => [vehicle]
    )
    ;jest.mocked(useVehiclesForBlockIds).mockImplementationOnce(
      (): (VehicleInScheduledService | Ghost)[] => [vehicle]
    )

    const mockedUsePanelState = mockUsePanelState()

    const user = userEvent.setup()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    await user.click(result.getByRole("button", { name: /close/i }))
    expect(mockedUsePanelState().closeView).toHaveBeenCalled()
  })

  test("remembers scroll position when unmounting", async () => {
    ;jest.mocked(useSwings).mockImplementationOnce((): Swing[] => [])

    const dispatch = jest.fn()
    const result = render(
      <StateDispatchProvider state={initialState} dispatch={dispatch}>
        <RoutesProvider routes={routes}>
          <SwingsView />
        </RoutesProvider>
      </StateDispatchProvider>
    )

    result.unmount()

    expect(dispatch).toHaveBeenCalledWith(rememberSwingsViewScrollPosition(0))
  })
})
