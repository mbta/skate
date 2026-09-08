import type { Meta, StoryObj } from "@storybook/react-webpack5"
import React, { useState } from "react"
import { RttQueue } from "../../../../src/components/radio/rtts/queue"
import {
  RttCall,
  RttTab,
  RttCallType,
} from "../../../../src/components/radio/rtts/types"
import { mockIncomingCalls, mockPastCalls } from "./__story-data__/rttQueueData"
import { RttSimulatorToolbar } from "./__story-data__/rttSimulatorToolbar"
import { rttCallFactory } from "../../../../tests/factories/radio/rtt"

const InteractivePrototypeWrapper = ({
  dispatcherName = "Dispatcher Alex",
}: {
  dispatcherName?: string
}) => {
  const [incomingCalls, setIncomingCalls] =
    useState<RttCall[]>(mockIncomingCalls)
  const [pastCalls, setPastCalls] = useState<RttCall[]>(mockPastCalls)
  const [currentTab, setCurrentTab] = useState<RttTab>("incoming")
  const [selectedCallId, setSelectedCallId] = useState<string | null>(
    mockIncomingCalls[0]?.id || null
  )
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [newIncomingCount, setNewIncomingCount] = useState<number>(0)
  const [simulatedSeq, setSimulatedSeq] = useState<number>(10)

  const handleSelectCall = (call: RttCall) => {
    setSelectedCallId(call.id)
  }

  const handleRespondCall = (call: RttCall) => {
    const now = new Date()
    const updatedIncoming = [...incomingCalls]
    let updatedPast = [...pastCalls]

    if (activeCallId && activeCallId !== call.id) {
      const priorIndex = updatedIncoming.findIndex((c) => c.id === activeCallId)
      if (priorIndex !== -1) {
        const priorCall = updatedIncoming[priorIndex]
        const doneCall: RttCall = {
          ...priorCall,
          status: "done",
          markedDoneAt: now,
        }
        updatedIncoming.splice(priorIndex, 1)
        updatedPast = [doneCall, ...updatedPast]
      }
    }

    const targetIndex = updatedIncoming.findIndex((c) => c.id === call.id)
    if (targetIndex !== -1) {
      const updatedCall: RttCall = {
        ...updatedIncoming[targetIndex],
        status: "active",
        respondedBy: dispatcherName,
        answeredAt: now,
      }
      updatedIncoming[targetIndex] = updatedCall
      setActiveCallId(call.id)
      setSelectedCallId(call.id)
    }

    setIncomingCalls(updatedIncoming)
    setPastCalls(updatedPast)
  }

  const handleMarkDoneCall = (call: RttCall) => {
    const targetIndex = incomingCalls.findIndex((c) => c.id === call.id)
    if (targetIndex !== -1) {
      const completedCall: RttCall = {
        ...incomingCalls[targetIndex],
        status: "done",
        markedDoneAt: new Date(),
      }
      const updatedIncoming = incomingCalls.filter((c) => c.id !== call.id)
      const updatedPast = [completedCall, ...pastCalls]

      setIncomingCalls(updatedIncoming)
      setPastCalls(updatedPast)

      if (activeCallId === call.id) {
        setActiveCallId(null)
      }
      if (selectedCallId === call.id) {
        setSelectedCallId(completedCall.id)
      }
    }
  }

  const handleTabChange = (tab: RttTab) => {
    setCurrentTab(tab)
    if (tab === "incoming") {
      setNewIncomingCount(0)
    }
  }

  const handleSimulateNewCall = (callType: RttCallType) => {
    const nextSeq = simulatedSeq + 1
    setSimulatedSeq(nextSeq)
    const newCall = rttCallFactory.build({
      id: `simulated-call-${nextSeq}`,
      callType,
      status: "unassigned",
      receivedAt: new Date(),
    })

    setIncomingCalls((prev) => [newCall, ...prev])
    if (currentTab === "past") {
      setNewIncomingCount((prev) => prev + 1)
    }
  }

  const handleResetData = () => {
    setIncomingCalls(mockIncomingCalls)
    setPastCalls(mockPastCalls)
    setCurrentTab("incoming")
    setSelectedCallId(mockIncomingCalls[0]?.id || null)
    setActiveCallId(null)
    setNewIncomingCount(0)
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
          incomingCalls={incomingCalls}
          pastCalls={pastCalls}
          currentTab={currentTab}
          selectedCallId={selectedCallId}
          activeCallId={activeCallId}
          newIncomingCount={newIncomingCount}
          currentDispatcherName={dispatcherName}
          onSelectCall={handleSelectCall}
          onRespondCall={handleRespondCall}
          onMarkDoneCall={handleMarkDoneCall}
          onTabChange={handleTabChange}
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
