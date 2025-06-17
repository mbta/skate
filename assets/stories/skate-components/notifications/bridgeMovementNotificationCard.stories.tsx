import type { Meta, StoryObj } from "@storybook/react"

import { BridgeMovementNotificationCard } from "../../../src/components/notificationCards/bridgeMovementNotificationCard"
import {
  Notification,
  NotificationType,
  NotificationState,
  BridgeRaisedNotification,
  BridgeLoweredNotification,
} from "../../../src/realtime"

const meta = {
  component: BridgeMovementNotificationCard,
  parameters: {
    layout: "centered",
  },
  args: {
    currentTime: new Date(),
    unread: true,
    onClose: () => {},
    onRead: () => {},
    onSelect: () => {},
    noFocusOrHover: true,
  },
} satisfies Meta<typeof BridgeMovementNotificationCard>

export default meta
type Story = StoryObj<typeof BridgeMovementNotificationCard>

const baseNotification = {
  id: "id",
  createdAt: new Date(),
  state: "unread" as NotificationState,
}

const BridgeRaisedNotificationContent = {
  $type: NotificationType.BridgeMovement,
  status: "raised",
  loweringTime: new Date(),
}

const BridgeRaised = {
  ...baseNotification,
  content: BridgeRaisedNotificationContent,
} as Notification<BridgeRaisedNotification>

const BridgeLoweredNotificationContent = {
  $type: NotificationType.BridgeMovement,
  status: "lowered",
}

const BridgeLowered = {
  ...baseNotification,
  content: BridgeLoweredNotificationContent,
} as Notification<BridgeLoweredNotification>

export const Raised: Story = {
  args: {
    notification: BridgeRaised,
  },
}

export const Lowered: Story = {
  args: {
    notification: BridgeLowered,
  },
}
