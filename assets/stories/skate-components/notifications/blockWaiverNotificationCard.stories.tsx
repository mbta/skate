import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { BlockWaiverNotificationCard } from "../../../src/components/notificationCards/blockWaiverNotificationCard"
import {
  Notification,
  NotificationType,
  NotificationState,
  BlockWaiverNotification,
} from "../../../src/realtime"
import routeFactory from "../../../tests/factories/route"
import { RoutesProvider } from "../../../src/contexts/routesContext"

const route = routeFactory.build()

const meta = {
  component: BlockWaiverNotificationCard,
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
  decorators: [
    (StoryFn) => (
      <RoutesProvider routes={[route]}>
        <StoryFn />
      </RoutesProvider>
    ),
  ],
} satisfies Meta<typeof BlockWaiverNotificationCard>

export default meta
type Story = StoryObj<typeof BlockWaiverNotificationCard>

const baseNotification = {
  id: "id",
  createdAt: new Date(),
  state: "unread" as NotificationState,
}

const blockWaiverContent = {
  $type: NotificationType.BlockWaiver,
  createdAt: new Date(),
  reason: "diverted",
  routeIds: [route.id],
  runIds: ["125-1163"],
  tripIds: [],
  operatorId: null,
  operatorName: null,
  routeIdAtCreation: route.id,
  routeAtCreation: null,
  startTime: new Date(),
  endTime: null,
}

const blockWaiverDiverted = {
  ...baseNotification,
  content: blockWaiverContent,
} as Notification<BlockWaiverNotification>

const blockWaiverManpower = {
  ...baseNotification,
  content: {
    ...blockWaiverContent,
    reason: "manpower",
  },
} as Notification<BlockWaiverNotification>

const blockWaiverDisabled = {
  ...baseNotification,
  content: {
    ...blockWaiverContent,
    reason: "disabled",
  },
} as Notification<BlockWaiverNotification>

const blockWaiverAccident = {
  ...baseNotification,
  content: {
    ...blockWaiverContent,
    reason: "accident",
  },
} as Notification<BlockWaiverNotification>

const blockWaiverAdjusted = {
  ...baseNotification,
  content: {
    ...blockWaiverContent,
    reason: "adjusted",
  },
} as Notification<BlockWaiverNotification>

const blockWaiverOperatorError = {
  ...baseNotification,
  content: {
    ...blockWaiverContent,
    reason: "operator_error",
  },
} as Notification<BlockWaiverNotification>

const blockWaiverTraffic = {
  ...baseNotification,
  content: {
    ...blockWaiverContent,
    reason: "traffic",
  },
} as Notification<BlockWaiverNotification>

const blockWaiverOther = {
  ...baseNotification,
  content: {
    ...blockWaiverContent,
    reason: "other",
  },
} as Notification<BlockWaiverNotification>

export const Diverted: Story = {
  args: {
    notification: blockWaiverDiverted,
  },
}

export const Manpower: Story = {
  args: {
    notification: blockWaiverManpower,
  },
}

export const Disabled: Story = {
  args: {
    notification: blockWaiverDisabled,
  },
}

export const Accident: Story = {
  args: {
    notification: blockWaiverAccident,
  },
}

export const Adjusted: Story = {
  args: {
    notification: blockWaiverAdjusted,
  },
}

export const OperatorError: Story = {
  args: {
    notification: blockWaiverOperatorError,
  },
}

export const Traffic: Story = {
  args: {
    notification: blockWaiverTraffic,
  },
}

export const Note: Story = {
  args: {
    notification: blockWaiverOther,
  },
}
