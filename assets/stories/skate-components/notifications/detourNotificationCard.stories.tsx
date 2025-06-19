import type { Meta, StoryObj } from "@storybook/react"

import { DetourNotificationCard } from "../../../src/components/notificationCards/detourNotificationCard"
import {
  Notification,
  NotificationType,
  DetourNotificationStatus,
  NotificationState,
  DetourExpirationNotification,
  DetourNotification,
} from "../../../src/realtime"

const meta = {
  component: DetourNotificationCard,
  parameters: {
    layout: "centered",
  },
  args: {
    currentTime: new Date(),
    unread: true,
    onClose: () => {},
    onRead: () => {},
    noFocusOrHover: true,
  },
} satisfies Meta<typeof DetourNotificationCard>

export default meta
type Story = StoryObj<typeof DetourNotificationCard>

const baseNotification = {
  id: "id",
  createdAt: new Date(),
  state: "unread" as NotificationState,
}

const detourNotificationContent = {
  $type: NotificationType.Detour,
  status: DetourNotificationStatus.Activated,
  detourId: 3,
  headsign: "Headsign",
  route: "66",
  direction: "Direction",
  origin: "Origin",
}

const detourActivatedNotification = {
  ...baseNotification,
  content: detourNotificationContent,
} as Notification<DetourNotification>

const detourDeactivatedNotification = {
  ...baseNotification,
  content: {
    ...detourNotificationContent,
    status: DetourNotificationStatus.Deactivated,
  },
} as Notification<DetourNotification>

const detourExpirationNotificationContent = {
  $type: NotificationType.DetourExpiration,
  detourId: 3,
  headsign: "Headsign",
  route: "66",
  direction: "Direction",
  origin: "Origin",
  isDispatcher: true,
  expiresIn: 0,
  estimatedDuration: "4 hours",
}

const detourExpirationNotification = {
  ...baseNotification,
  content: detourExpirationNotificationContent,
} as Notification<DetourExpirationNotification>

const detourExpirationWarningNotification = {
  ...baseNotification,
  content: {
    ...detourExpirationNotificationContent,
    expiresIn: 30,
  },
} as Notification<DetourExpirationNotification>

export const Activated: Story = {
  args: {
    notification: detourActivatedNotification,
  },
}

export const Deactivated: Story = {
  args: {
    notification: detourDeactivatedNotification,
  },
}

export const DetourExpiration: Story = {
  args: {
    notification: detourExpirationNotification,
  },
}

export const DetourExpirationWarning: Story = {
  args: {
    notification: detourExpirationWarningNotification,
  },
}
