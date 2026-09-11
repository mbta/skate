import type { Meta, StoryObj } from "@storybook/react-webpack5"
import React, { useState } from "react"
import { within, userEvent, expect } from "storybook/test"
import { RttQueue } from "../../../../src/components/radio/rtts/queue"
import { useRttQueue } from "../../../../src/components/radio/rtts/useRttQueue"
import { RttCallType } from "../../../../src/components/radio/rtts/types"
import { rttCallFactory } from "../../../../tests/factories/radio/rtt"
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
    const [seq, setSeq] = useState(10)

    const queue = useRttQueue({
      initialState: {
        incomingCalls: args.incomingCalls,
        pastCalls: args.pastCalls,
        selectedCallId: args.incomingCalls?.[0]?.id || null,
        tab: args.currentTab,
      },
      currentDispatcherName: args.currentDispatcherName,
    })

    const handleTriggerCall = (callType: RttCallType) => {
      const nextSeq = seq + 1
      setSeq(nextSeq)
      const newCall = rttCallFactory.build({
        id: `sim-call-${nextSeq}`,
        callType,
        status: "unassigned",
        receivedAt: new Date(),
      })
      queue.actions.receiveCall(newCall)
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.375rem 0.75rem",
            backgroundColor: "#fff",
            border: "1px solid #d4d7db",
            borderRadius: "0.375rem",
            fontSize: "0.75rem",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 600, color: "#374151" }}>
            Simulate Incoming:
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="c-rtt-queue-item__respond-btn"
              style={{ backgroundColor: "#9c074d", padding: "0.2rem 0.5rem" }}
              onClick={() => handleTriggerCall("Emergency")}
            >
              + Emergency
            </button>
            <button
              type="button"
              className="c-rtt-queue-item__respond-btn"
              style={{ backgroundColor: "#d97706", padding: "0.2rem 0.5rem" }}
              onClick={() => handleTriggerCall("PRTT")}
            >
              + PRTT
            </button>
            <button
              type="button"
              className="c-rtt-queue-item__respond-btn"
              style={{ backgroundColor: "#572e8a", padding: "0.2rem 0.5rem" }}
              onClick={() => handleTriggerCall("RTT")}
            >
              + RTT
            </button>
          </div>
        </div>

        <div style={{ flex: "1 1 auto", minHeight: 0 }}>
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
        </div>
      </div>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("Switch to Past tab", async () => {
      const pastTab = canvas.getByRole("tab", { name: /^past$/i })
      await userEvent.click(pastTab)
      await expect(pastTab).toHaveAttribute("aria-selected", "true")
    })

    await step(
      "Simulate incoming Emergency call while on Past tab",
      async () => {
        const emergencyTrigger = canvas.getByRole("button", {
          name: "+ Emergency",
        })
        await userEvent.click(emergencyTrigger)

        // Verify incoming tab displays notification badge
        await expect(canvas.getByText("1 NEW")).toBeInTheDocument()
      }
    )

    await step("Navigate to Incoming tab to view new call", async () => {
      const incomingTab = canvas.getByRole("tab", { name: /incoming/i })
      await userEvent.click(incomingTab)
      await expect(incomingTab).toHaveAttribute("aria-selected", "true")

      // Prioritized Emergency badge should be visible
      await expect(canvas.getAllByText("Emergency")[0]).toBeInTheDocument()
    })

    await step("Respond to incoming call and verify live mode", async () => {
      const respondButtons = canvas.getAllByRole("button", {
        name: /respond/i,
      })
      await userEvent.click(respondButtons[0])

      // Verify call transitioned to Live mode
      await expect(canvas.getByText("Live Call")).toBeInTheDocument()
      await expect(
        canvas.getByRole("button", { name: /mark done/i })
      ).toBeInTheDocument()
    })
  },
}
