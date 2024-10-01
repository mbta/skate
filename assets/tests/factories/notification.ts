import { Factory } from "fishery"
import {
  BlockWaiverNotification,
  BlockWaiverReason,
  BridgeLoweredNotification,
  BridgeRaisedNotification,
  DetourNotification,
  DetourNotificationStatus,
  Notification,
  NotificationType,
} from "../../src/realtime"
import routeFactory from "./route"
import { runIdFactory } from "./run"
import { TripFactory } from "./trip"

export const blockWaiverReasonFactory = Factory.define<BlockWaiverReason>(
  ({ sequence }) => {
    const reasons: BlockWaiverReason[] = [
      "manpower",
      "accident",
      "adjusted",
      "disabled",
      "diverted",
      "operator_error",
      "traffic",
      "other",
    ]

    return reasons[sequence % reasons.length]
  }
)

const blockWaiverNotificationContentFactory =
  Factory.define<BlockWaiverNotification>(() => {
    return {
      $type: NotificationType.BlockWaiver,
      reason: blockWaiverReasonFactory.build(),
      routeIds: [routeFactory.build().id],
      runIds: [runIdFactory.build()],
      tripIds: [TripFactory.build().id],
      operatorName: null,
      operatorId: null,
      routeIdAtCreation: null,
      startTime: new Date(),
      endTime: new Date(),
      createdAt: new Date(),
    }
  })

export const blockWaiverNotificationFactory = Factory.define<
  Notification<BlockWaiverNotification>
>(({ sequence }) => ({
  id: sequence.toString(),
  createdAt: new Date(),
  state: "unread",
  content: blockWaiverNotificationContentFactory.build(),
}))

const bridgeRaisedNotificationContentFactory =
  Factory.define<BridgeRaisedNotification>(() => ({
    $type: NotificationType.BridgeMovement,
    loweringTime: new Date(),
    status: "raised",
  }))

export const bridgeRaisedNotificationFactory = Factory.define<
  Notification<BridgeRaisedNotification>
>(({ sequence }) => ({
  id: sequence.toString(),
  createdAt: new Date(),
  state: "unread",
  content: bridgeRaisedNotificationContentFactory.build(),
}))

const bridgeLoweredNotificationContentFactory =
  Factory.define<BridgeLoweredNotification>(() => ({
    $type: NotificationType.BridgeMovement,
    status: "lowered",
  }))

export const bridgeLoweredNotificationFactory = Factory.define<
  Notification<BridgeLoweredNotification>
>(({ sequence }) => ({
  id: sequence.toString(),
  createdAt: new Date(),
  state: "unread",
  content: bridgeLoweredNotificationContentFactory.build(),
}))

const detourActivatedNotificationContentFactory =
  Factory.define<DetourNotification>(({ sequence }) => ({
    $type: NotificationType.Detour,
    status: DetourNotificationStatus.Activated,
    detourId: sequence,
    headsign: `Headsign ${sequence}`,
    route: `${sequence}`,
    direction: "Outbound",
    origin: `Origin station ${sequence}`,
  }))

export const detourActivatedNotificationFactory = Factory.define<
  Notification<DetourNotification>
>(({ sequence }) => ({
  id: sequence.toString(),
  createdAt: new Date(),
  state: "unread",
  content: detourActivatedNotificationContentFactory.build(),
}))
