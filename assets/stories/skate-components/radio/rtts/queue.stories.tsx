import type { Meta, StoryObj } from "@storybook/react-webpack5"
import React from "react"
import { RttQueue } from "../../../../src/components/radio/rtts/queue"
import { useRttQueue } from "../../../../src/components/radio/rtts/useRttQueue"
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
  argTypes: {
    currentTab: {
      control: "radio",
      options: ["incoming", "past"],
      description: "Active queue tab view",
    },
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

export const InteractiveQueueLifecycle: Story = {
  render: function InteractiveStory(args) {
    const queue = useRttQueue({
      initialState: {
        incomingCalls: args.incomingCalls,
        pastCalls: args.pastCalls,
        selectedCallId: args.incomingCalls?.[0]?.id || null,
        tab: args.currentTab,
      },
      currentDispatcherName: args.currentDispatcherName,
    })

    return (
      <RttQueue
        incomingCalls={queue.calls.incoming}
        pastCalls={queue.calls.past}
        currentTab={queue.tabs.current}
        selectedCallId={queue.calls.selectedId}
        activeCallId={queue.calls.activeId}
        newIncomingCount={queue.tabs.newIncomingCount}
        currentDispatcherName={args.currentDispatcherName}
        onSelectCall={queue.actions.selectCall}
        onRespondCall={queue.actions.respondCall}
        onMarkDoneCall={queue.actions.markDoneCall}
        onTabChange={queue.actions.changeTab}
      />
    )
  },
}
