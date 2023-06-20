import { renderHook } from "@testing-library/react"
import React, { ReactElement } from "react"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useVehicleForNotification from "../../src/hooks/useVehicleForNotification"
import {
  GhostData,
  ghostFromData,
  VehicleData,
  vehicleInScheduledServiceFromData,
} from "../../src/models/vehicleData"
import { NotificationReason, NotificationState } from "../../src/realtime"
import { initialState } from "../../src/state"
import {
  makeMockChannel,
  makeMockOneShotChannel,
  makeMockSocket,
} from "../testHelpers/socketHelpers"
import vehicleDataFactory from "../factories/vehicle_data"
import ghostDataFactory from "../factories/ghost_data"
import { tagManagerEvent } from "../../src/helpers/googleTagManager"
import { mockFullStoryEvent } from "../testHelpers/mockHelpers"

jest.mock("../../src/helpers/googleTagManager", () => ({
  __esModule: true,
  tagManagerEvent: jest.fn(),
}))

const runId = "run_id"

const ghostData: GhostData = ghostDataFactory.build({ run_id: runId })

const vehicleData: VehicleData = vehicleDataFactory.build({ run_id: runId })

const wrapper = ({ children }: { children: ReactElement<HTMLElement> }) => (
  <StateDispatchProvider state={initialState} dispatch={jest.fn()}>
    {children}
  </StateDispatchProvider>
)

describe("useVehicleForNotification", () => {
  const notification = {
    id: "123",
    createdAt: new Date(),
    tripIds: ["123", "456", "789"],
    reason: "other" as NotificationReason,
    routeIds: [],
    runIds: [runId],
    operatorName: null,
    operatorId: null,
    routeIdAtCreation: null,
    startTime: new Date(),
    endTime: new Date(),
    state: "unread" as NotificationState,
  }

  test("parses vehicle data from channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockOneShotChannel([vehicleData])
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(
      () => {
        return useVehicleForNotification(notification, mockSocket)
      },
      { wrapper }
    )

    expect(result.current).toEqual(
      vehicleInScheduledServiceFromData(vehicleData)
    )

    expect(tagManagerEvent).toHaveBeenCalledWith("notification_linked_to_vpp")
  })

  test("parses ghost data from channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockOneShotChannel([ghostData])
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockFullStoryEvent()

    const { result } = renderHook(
      () => {
        return useVehicleForNotification(notification, mockSocket)
      },
      { wrapper }
    )

    expect(result.current).toEqual(ghostFromData(ghostData))

    expect(tagManagerEvent).toHaveBeenCalledWith("notification_linked_to_vpp")
    expect(window.FS!.event).toBeCalledWith(
      "User clicked Notification and linked to VPP"
    )
  })

  test("only logs event once", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: [vehicleData] })
    mockSocket.channel.mockImplementation(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "event") {
        handler({
          data: [vehicleData],
        })
      }
    })

    const { rerender } = renderHook(
      () => {
        return useVehicleForNotification(notification, mockSocket)
      },
      { wrapper }
    )

    rerender()

    expect(tagManagerEvent).toHaveBeenCalledTimes(1)
  })

  test("handles missing data from channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockOneShotChannel(null)
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockFullStoryEvent()

    const { result } = renderHook(
      () => {
        return useVehicleForNotification(
          {
            ...notification,
            startTime: new Date("2019-10-06"),
          },
          mockSocket
        )
      },
      { wrapper }
    )
    expect(result.current).toBeNull()
    expect(tagManagerEvent).toHaveBeenCalledWith(
      "notification_linked_to_inactive_modal"
    )
    expect(window.FS!.event).toBeCalledWith(
      "User clicked Notification and linked to Inactive Modal"
    )
  })

  test("handles empty result from channel", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockOneShotChannel([])
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockFullStoryEvent()

    const { result } = renderHook(
      () => {
        return useVehicleForNotification(
          {
            ...notification,
            startTime: new Date("2019-10-06"),
          },
          mockSocket
        )
      },
      { wrapper }
    )
    expect(result.current).toBeNull()
    expect(tagManagerEvent).toHaveBeenCalledWith(
      "notification_linked_to_inactive_modal"
    )
    expect(window.FS!.event).toBeCalledWith(
      "User clicked Notification and linked to Inactive Modal"
    )
  })
})
