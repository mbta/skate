import React, { useState, useMemo } from "react"
import { RttCall, RttTab, sortRttCalls } from "./types"
import { RttQueueItem } from "./queueItem"
import { RttDetailsPanel } from "./detailsPanel"
import { ActiveRttBanner } from "./activeBanner"

export interface RttQueueProps {
  incomingCalls?: RttCall[]
  pastCalls?: RttCall[]
  selectedCallId?: string | null
  activeCallId?: string | null
  currentTab?: RttTab
  newIncomingCount?: number
  currentDispatcherName?: string
  onSelectCall?: (call: RttCall) => void
  onRespondCall?: (call: RttCall) => void
  onMarkDoneCall?: (call: RttCall) => void
  onTabChange?: (tab: RttTab) => void
}

export const RttQueue = ({
  incomingCalls: incomingCallsProp,
  pastCalls: pastCallsProp,
  selectedCallId: selectedCallIdProp,
  activeCallId: activeCallIdProp,
  currentTab: currentTabProp,
  newIncomingCount: newIncomingCountProp,
  currentDispatcherName = "Current Dispatcher",
  onSelectCall,
  onRespondCall,
  onMarkDoneCall,
  onTabChange,
}: RttQueueProps): JSX.Element => {
  // Local state for uncontrolled or interactive usage
  const [internalTab, setInternalTab] = useState<RttTab>("incoming")
  const [internalIncomingCalls, setInternalIncomingCalls] = useState<RttCall[]>(
    incomingCallsProp ?? []
  )
  const [internalPastCalls, setInternalPastCalls] = useState<RttCall[]>(
    pastCallsProp ?? []
  )
  const [internalSelectedCallId, setInternalSelectedCallId] = useState<
    string | null
  >(selectedCallIdProp ?? null)
  const [internalActiveCallId, setInternalActiveCallId] = useState<
    string | null
  >(activeCallIdProp ?? null)
  const [internalNewIncomingCount, setInternalNewIncomingCount] = useState(
    newIncomingCountProp ?? 0
  )

  const isControlled = incomingCallsProp !== undefined
  const tab = currentTabProp !== undefined ? currentTabProp : internalTab
  const incomingCalls = isControlled ? incomingCallsProp : internalIncomingCalls
  const pastCalls = pastCallsProp !== undefined ? pastCallsProp : internalPastCalls
  const selectedCallId =
    selectedCallIdProp !== undefined
      ? selectedCallIdProp
      : internalSelectedCallId
  const activeCallId =
    activeCallIdProp !== undefined ? activeCallIdProp : internalActiveCallId
  const newIncomingCount =
    newIncomingCountProp !== undefined
      ? newIncomingCountProp
      : internalNewIncomingCount

  // Sorted calls
  const sortedIncomingCalls = useMemo(
    () => sortRttCalls(incomingCalls),
    [incomingCalls]
  )
  const sortedPastCalls = useMemo(
    () =>
      [...pastCalls].sort(
        (a, b) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      ),
    [pastCalls]
  )

  const activeCallsList = tab === "incoming" ? sortedIncomingCalls : sortedPastCalls

  // Currently selected call
  const selectedCall = useMemo(() => {
    const allCalls = [...incomingCalls, ...pastCalls]
    return allCalls.find((c) => c.id === selectedCallId) || null
  }, [incomingCalls, pastCalls, selectedCallId])

  // Active call (the one currently responded to by the current user)
  const activeCall = useMemo(() => {
    return incomingCalls.find((c) => c.id === activeCallId) || null
  }, [incomingCalls, activeCallId])

  const handleTabClick = (newTab: RttTab) => {
    if (!isControlled) {
      setInternalTab(newTab)
      if (newTab === "incoming") {
        setInternalNewIncomingCount(0)
      }
    }
    onTabChange?.(newTab)
  }

  const handleSelectCall = (call: RttCall) => {
    if (!isControlled) {
      setInternalSelectedCallId(call.id)
    }
    onSelectCall?.(call)
  }

  const handleRespondCall = (call: RttCall) => {
    if (!isControlled) {
      // 1. If user already had an active call, mark that prior call as done
      let updatedIncoming = [...internalIncomingCalls]
      let updatedPast = [...internalPastCalls]

      if (internalActiveCallId) {
        const priorActiveIndex = updatedIncoming.findIndex(
          (c) => c.id === internalActiveCallId
        )
        if (priorActiveIndex !== -1) {
          const priorActive = updatedIncoming[priorActiveIndex]
          const completedPrior: RttCall = {
            ...priorActive,
            status: "done",
            markedDoneAt: new Date(),
          }
          updatedIncoming.splice(priorActiveIndex, 1)
          updatedPast = [completedPrior, ...updatedPast]
        }
      }

      // 2. Mark this call as active
      const now = new Date()
      const respondedCallIndex = updatedIncoming.findIndex(
        (c) => c.id === call.id
      )
      if (respondedCallIndex !== -1) {
        const respondedCall: RttCall = {
          ...updatedIncoming[respondedCallIndex],
          status: "active",
          respondedBy: currentDispatcherName,
          answeredAt: now,
        }
        updatedIncoming[respondedCallIndex] = respondedCall
        setInternalActiveCallId(call.id)
        setInternalSelectedCallId(call.id)
      }

      setInternalIncomingCalls(updatedIncoming)
      setInternalPastCalls(updatedPast)
    }

    onRespondCall?.(call)
  }

  const handleMarkDoneCall = (call: RttCall) => {
    if (!isControlled) {
      const now = new Date()
      const callIndex = internalIncomingCalls.findIndex((c) => c.id === call.id)

      if (callIndex !== -1) {
        const completedCall: RttCall = {
          ...internalIncomingCalls[callIndex],
          status: "done",
          markedDoneAt: now,
        }
        const updatedIncoming = internalIncomingCalls.filter(
          (c) => c.id !== call.id
        )
        const updatedPast = [completedCall, ...internalPastCalls]

        setInternalIncomingCalls(updatedIncoming)
        setInternalPastCalls(updatedPast)

        if (internalActiveCallId === call.id) {
          setInternalActiveCallId(null)
        }
        if (internalSelectedCallId === call.id) {
          setInternalSelectedCallId(completedCall.id)
        }
      }
    }

    onMarkDoneCall?.(call)
  }

  const isSelectedLive =
    Boolean(selectedCall && selectedCall.id === activeCallId) ||
    Boolean(selectedCall && selectedCall.status === "active")

  return (
    <div className="c-rtt-queue">
      {tab === "past" && activeCall && (
        <ActiveRttBanner
          activeCall={activeCall}
          onMarkDone={handleMarkDoneCall}
          onSelectActive={handleSelectCall}
        />
      )}

      <header className="c-rtt-queue__header">
        <h1 className="c-rtt-queue__title">📻 Radio RTT Queue</h1>

        <nav className="c-rtt-queue__tabs" aria-label="RTT Queue Views">
          <button
            type="button"
            className={`c-rtt-queue__tab ${
              tab === "incoming" ? "c-rtt-queue__tab--active" : ""
            }`}
            onClick={() => handleTabClick("incoming")}
          >
            Incoming
            {tab === "past" && newIncomingCount > 0 && (
              <span className="c-rtt-queue__tab-badge">
                {newIncomingCount} new
              </span>
            )}
          </button>
          <button
            type="button"
            className={`c-rtt-queue__tab ${
              tab === "past" ? "c-rtt-queue__tab--active" : ""
            }`}
            onClick={() => handleTabClick("past")}
          >
            Past
          </button>
        </nav>
      </header>

      <div className="c-rtt-queue__body">
        <section className="c-rtt-queue__list-pane" aria-label="Calls list">
          {activeCallsList.length === 0 ? (
            <div className="c-rtt-queue__empty">
              <div className="c-rtt-queue__empty-icon">📻</div>
              <div className="c-rtt-queue__empty-title">
                {tab === "incoming"
                  ? "No Incoming RTT Calls"
                  : "No Past RTT Calls"}
              </div>
              <p className="c-rtt-queue__empty-desc">
                {tab === "incoming"
                  ? "Incoming and active driver requests to talk will appear here."
                  : "Completed calls marked as done will appear here."}
              </p>
            </div>
          ) : (
            activeCallsList.map((call) => (
              <RttQueueItem
                key={call.id}
                call={call}
                tab={tab}
                isSelected={selectedCallId === call.id}
                onSelect={handleSelectCall}
                onRespond={handleRespondCall}
              />
            ))
          )}
        </section>

        <section
          className="c-rtt-queue__details-pane"
          aria-label="Call details"
        >
          <RttDetailsPanel
            call={selectedCall}
            isLive={isSelectedLive}
            onMarkDone={handleMarkDoneCall}
          />
        </section>
      </div>
    </div>
  )
}
