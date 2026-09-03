import type { Meta, StoryObj } from "@storybook/react-webpack5"
import React, { useState } from "react"
import { RttQueue } from "../../../../src/components/radio/rtts/queue"
import {
  RttCall,
  RttTab,
  RttCallType,
} from "../../../../src/components/radio/rtts/types"
import { mockIncomingCalls, mockPastCalls } from "./__story-data__/rttQueueData"
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
    const updatedIncoming = [...incomingCalls]
    let updatedPast = [...pastCalls]

    // 1. If user already had an active call, auto-complete that prior call
    if (activeCallId && activeCallId !== call.id) {
      const priorIndex = updatedIncoming.findIndex((c) => c.id === activeCallId)
      if (priorIndex !== -1) {
        const priorCall = updatedIncoming[priorIndex]
        const doneCall: RttCall = {
          ...priorCall,
          status: "done",
          markedDoneAt: new Date(),
        }
        updatedIncoming.splice(priorIndex, 1)
        updatedPast = [doneCall, ...updatedPast]
      }
    }

    // 2. Mark target call active
    const targetIndex = updatedIncoming.findIndex((c) => c.id === call.id)
    if (targetIndex !== -1) {
      const updatedCall: RttCall = {
        ...updatedIncoming[targetIndex],
        status: "active",
        respondedBy: dispatcherName,
        answeredAt: new Date(),
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
      {/* Simulation Toolbar for Storybook Prototype */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 1rem",
          backgroundColor: "#fff",
          border: "1px solid #d4d7db",
          borderRadius: "0.375rem",
          fontSize: "0.8125rem",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <strong>Prototype Simulator:</strong>
          <span>
            Logged in as: <em>{dispatcherName}</em>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Trigger New Call:</span>
          <button
            type="button"
            className="c-rtt-queue-item__respond-btn"
            style={{ backgroundColor: "#9c074d", padding: "0.25rem 0.5rem" }}
            onClick={() => handleSimulateNewCall("Emergency")}
          >
            + Emergency
          </button>
          <button
            type="button"
            className="c-rtt-queue-item__respond-btn"
            style={{ backgroundColor: "#d97706", padding: "0.25rem 0.5rem" }}
            onClick={() => handleSimulateNewCall("PRTT")}
          >
            + PRTT
          </button>
          <button
            type="button"
            className="c-rtt-queue-item__respond-btn"
            style={{ backgroundColor: "#572e8a", padding: "0.25rem 0.5rem" }}
            onClick={() => handleSimulateNewCall("RTT")}
          >
            + RTT
          </button>
          <button
            type="button"
            className="c-rtt-details-panel__mark-done-btn"
            style={{ padding: "0.25rem 0.5rem" }}
            onClick={handleResetData}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main RTT Queue Component */}
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
  title: "Skate/Radio/RTTs/Interactive Prototype",
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
