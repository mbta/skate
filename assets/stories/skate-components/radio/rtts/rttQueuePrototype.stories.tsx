import type { Meta, StoryObj } from "@storybook/react-webpack5"
import React, { useState } from "react"
import { RttQueue } from "../../../../src/components/radio/rtts/queue"
import { useRttQueue } from "../../../../src/components/radio/rtts/useRttQueue"
import { RttCallType } from "../../../../src/components/radio/rtts/types"
import { mockIncomingCalls, mockPastCalls } from "./__story-data__/rttQueueData"
import { RttSimulatorToolbar } from "./__story-data__/rttSimulatorToolbar"
import { rttCallFactory } from "../../../../tests/factories/radio/rtt"

const InteractivePrototypeWrapper = ({
  dispatcherName = "Dispatcher Alex",
}: {
  dispatcherName?: string
}) => {
  const [simulatedSeq, setSimulatedSeq] = useState<number>(10)

  const queue = useRttQueue({
    initialState: {
      incomingCalls: mockIncomingCalls,
      pastCalls: mockPastCalls,
      selectedCallId: mockIncomingCalls[0]?.id || null,
    },
    currentDispatcherName: dispatcherName,
  })

  const handleSimulateNewCall = (callType: RttCallType) => {
    const nextSeq = simulatedSeq + 1
    setSimulatedSeq(nextSeq)
    const newCall = rttCallFactory.build({
      id: `simulated-call-${nextSeq}`,
      callType,
      status: "unassigned",
      receivedAt: new Date(),
    })
    queue.actions.receiveCall(newCall)
  }

  const handleResetData = () => {
    queue.actions.reset({
      incomingCalls: mockIncomingCalls,
      pastCalls: mockPastCalls,
      tab: "incoming",
      selectedCallId: mockIncomingCalls[0]?.id || null,
      activeCallId: null,
      newIncomingCount: 0,
    })
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "1rem",
        boxSizing: "border-box",
        backgroundColor: "#f2f3f5",
        gap: "0.75rem",
      }}
    >
      <RttSimulatorToolbar
        dispatcherName={dispatcherName}
        onSimulateNewCall={handleSimulateNewCall}
        onReset={handleResetData}
      />

      <div style={{ flex: "1 1 auto", minHeight: 0 }}>
        <RttQueue
          incomingCalls={queue.calls.incoming}
          pastCalls={queue.calls.past}
          currentTab={queue.tabs.current}
          selectedCallId={queue.calls.selectedId}
          activeCallId={queue.calls.activeId}
          newIncomingCount={queue.tabs.newIncomingCount}
          currentDispatcherName={dispatcherName}
          onSelectCall={queue.actions.selectCall}
          onRespondCall={queue.actions.respondCall}
          onMarkDoneCall={queue.actions.markDoneCall}
          onTabChange={queue.actions.changeTab}
        />
      </div>
    </div>
  )
}

const meta = {
  title: "radio/rtts/Interactive Prototype",
  component: InteractivePrototypeWrapper,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    dispatcherName: "Dispatcher Alex",
  },
} satisfies Meta<typeof InteractivePrototypeWrapper>

export default meta
type Story = StoryObj<typeof InteractivePrototypeWrapper>

export const InteractiveDemo: Story = {}
