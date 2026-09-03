import type { Meta, StoryObj } from "@storybook/react-webpack5"
import React from "react"
import { RttQueue } from "../../../../src/components/radio/rtts/queue"
import {
  mockIncomingCalls,
  mockPastCalls,
  mockEmergencyCall,
} from "./__story-data__/rttQueueData"

const meta = {
  component: RttQueue,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    incomingCalls: mockIncomingCalls,
    pastCalls: mockPastCalls,
    currentTab: "incoming",
    currentDispatcherName: "Dispatcher Alex",
  },
  decorators: [
    (StoryFn) => (
      <div
        style={{
          height: "100vh",
          padding: "1rem",
          boxSizing: "border-box",
          backgroundColor: "#f2f3f5",
        }}
      >
        <StoryFn />
      </div>
    ),
  ],
} satisfies Meta<typeof RttQueue>

export default meta
type Story = StoryObj<typeof RttQueue>

export const IncomingCallsDefault: Story = {}

export const WithSelectedCall: Story = {
  args: {
    selectedCallId: mockEmergencyCall.id,
  },
}

export const PastCallsView: Story = {
  args: {
    currentTab: "past",
  },
}

export const PastViewWithActiveCallBanner: Story = {
  args: {
    currentTab: "past",
    activeCallId: mockEmergencyCall.id,
  },
}

export const PastViewWithNewIncomingBadge: Story = {
  args: {
    currentTab: "past",
    newIncomingCount: 2,
  },
}

export const EmptyIncomingQueue: Story = {
  args: {
    incomingCalls: [],
    pastCalls: [],
  },
}

export const EmptyPastQueue: Story = {
  args: {
    incomingCalls: mockIncomingCalls,
    pastCalls: [],
    currentTab: "past",
  },
}
