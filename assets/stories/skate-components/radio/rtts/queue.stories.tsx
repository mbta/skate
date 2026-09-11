import type { Meta, StoryObj } from "@storybook/react-webpack5"
import React from "react"
import { within, userEvent, expect } from "storybook/test"
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Select incoming call and inspect details", async () => {
      const emergencyRow = canvas.getByRole("button", {
        name: /select emergency call/i,
      })
      await userEvent.click(emergencyRow)

      const detailsPane = canvas.getByRole("region", { name: "Call details" })
      const details = within(detailsPane)

      await expect(
        details.getByRole("heading", { level: 2, name: /emergency/i })
      ).toBeInTheDocument()
      await expect(details.getByText(/Shania Twain/i)).toBeInTheDocument()
    })

    await step(
      "Respond to incoming call and transition to live mode",
      async () => {
        const respondButtons = canvas.getAllByRole("button", {
          name: /respond/i,
        })
        await userEvent.click(respondButtons[0])

        // Verify live call banner / tag appears and mark done button is active in details panel
        const detailsPane = canvas.getByRole("region", { name: "Call details" })
        const details = within(detailsPane)

        await expect(details.getByText("Live Call")).toBeInTheDocument()
        await expect(
          details.getByRole("button", { name: /mark done/i })
        ).toBeInTheDocument()
      }
    )

    await step(
      "Switch to Past tab during active call and verify top banner",
      async () => {
        const pastTab = canvas.getByRole("tab", { name: /^past$/i })
        await userEvent.click(pastTab)
        await expect(pastTab).toHaveAttribute("aria-selected", "true")

        // Active banner should appear at top with Mark Done
        await expect(
          canvas.getByRole("region", { name: "Active Call Banner" })
        ).toBeInTheDocument()
      }
    )

    await step("Mark active call done from the top banner", async () => {
      const banner = canvas.getByRole("region", { name: "Active Call Banner" })
      const markDoneBtn = within(banner).getByRole("button", {
        name: /mark done/i,
      })
      await userEvent.click(markDoneBtn)

      // Active banner should disappear once marked done
      await expect(
        canvas.queryByRole("region", { name: "Active Call Banner" })
      ).not.toBeInTheDocument()
    })
  },
}
