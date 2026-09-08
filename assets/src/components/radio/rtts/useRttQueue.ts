import { useState, useMemo } from "react"
import { RttCall, RttTab, sortRttCalls } from "./types"

export interface UseRttQueueOptions {
  defaultIncomingCalls?: RttCall[]
  incomingCalls?: RttCall[]
  defaultPastCalls?: RttCall[]
  pastCalls?: RttCall[]
  defaultSelectedCallId?: string | null
  selectedCallId?: string | null
  defaultActiveCallId?: string | null
  activeCallId?: string | null
  defaultTab?: RttTab
  currentTab?: RttTab
  newIncomingCount?: number
  currentDispatcherName?: string
  onSelectCall?: (call: RttCall) => void
  onRespondCall?: (call: RttCall) => void
  onMarkDoneCall?: (call: RttCall) => void
  onTabChange?: (tab: RttTab) => void
}

export const useRttQueue = ({
  defaultIncomingCalls,
  incomingCalls: incomingCallsProp,
  defaultPastCalls,
  pastCalls: pastCallsProp,
  defaultSelectedCallId,
  selectedCallId: selectedCallIdProp,
  defaultActiveCallId,
  activeCallId: activeCallIdProp,
  defaultTab,
  currentTab: currentTabProp,
  newIncomingCount: newIncomingCountProp,
  currentDispatcherName = "Current Dispatcher",
  onSelectCall,
  onRespondCall,
  onMarkDoneCall,
  onTabChange,
}: UseRttQueueOptions) => {
  const [internalTab, setInternalTab] = useState<RttTab>(
    currentTabProp ?? defaultTab ?? "incoming"
  )
  const [internalIncomingCalls, setInternalIncomingCalls] = useState<RttCall[]>(
    incomingCallsProp ?? defaultIncomingCalls ?? []
  )
  const [internalPastCalls, setInternalPastCalls] = useState<RttCall[]>(
    pastCallsProp ?? defaultPastCalls ?? []
  )
  const [internalSelectedCallId, setInternalSelectedCallId] = useState<
    string | null
  >(selectedCallIdProp ?? defaultSelectedCallId ?? null)
  const [internalActiveCallId, setInternalActiveCallId] = useState<
    string | null
  >(activeCallIdProp ?? defaultActiveCallId ?? null)
  const [internalNewIncomingCount, setInternalNewIncomingCount] = useState(
    newIncomingCountProp ?? 0
  )

  const tab = currentTabProp !== undefined ? currentTabProp : internalTab
  const incomingCalls =
    incomingCallsProp !== undefined ? incomingCallsProp : internalIncomingCalls
  const pastCalls =
    pastCallsProp !== undefined ? pastCallsProp : internalPastCalls
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

  const activeCallsList =
    tab === "incoming" ? sortedIncomingCalls : sortedPastCalls

  const selectedCall = useMemo(() => {
    const allCalls = [...incomingCalls, ...pastCalls]
    return allCalls.find((c) => c.id === selectedCallId) || null
  }, [incomingCalls, pastCalls, selectedCallId])

  const activeCall = useMemo(() => {
    return incomingCalls.find((c) => c.id === activeCallId) || null
  }, [incomingCalls, activeCallId])

  const handleTabClick = (newTab: RttTab) => {
    if (currentTabProp === undefined) {
      setInternalTab(newTab)
      if (newTab === "incoming") {
        setInternalNewIncomingCount(0)
      }
    }
    onTabChange?.(newTab)
  }

  const handleSelectCall = (call: RttCall) => {
    if (selectedCallIdProp === undefined) {
      setInternalSelectedCallId(call.id)
    }
    onSelectCall?.(call)
  }

  const handleRespondCall = (call: RttCall) => {
    const now = new Date()
    const activeId =
      activeCallIdProp !== undefined ? activeCallIdProp : internalActiveCallId

    setInternalIncomingCalls((prevIncoming) => {
      return prevIncoming
        .filter((c) => !(activeId && c.id === activeId && c.id !== call.id))
        .map((c) => {
          if (c.id === call.id) {
            return {
              ...c,
              status: "active",
              respondedBy: currentDispatcherName,
              answeredAt: now,
            }
          }
          return c
        })
    })

    if (activeId && activeId !== call.id) {
      const priorCall = incomingCalls.find((c) => c.id === activeId)
      if (priorCall) {
        const completed: RttCall = {
          ...priorCall,
          status: "done",
          markedDoneAt: now,
        }
        setInternalPastCalls((prevPast) => [completed, ...prevPast])
      }
    }

    if (activeCallIdProp === undefined) {
      setInternalActiveCallId(call.id)
    }
    if (selectedCallIdProp === undefined) {
      setInternalSelectedCallId(call.id)
    }

    onRespondCall?.(call)
  }

  const handleMarkDoneCall = (call: RttCall) => {
    const now = new Date()

    setInternalIncomingCalls((prevIncoming) =>
      prevIncoming.filter((c) => c.id !== call.id)
    )

    const completedCall: RttCall = {
      ...call,
      status: "done",
      markedDoneAt: now,
    }
    setInternalPastCalls((prevPast) => [completedCall, ...prevPast])

    if (activeCallIdProp === undefined && internalActiveCallId === call.id) {
      setInternalActiveCallId(null)
    }
    if (
      selectedCallIdProp === undefined &&
      internalSelectedCallId === call.id
    ) {
      setInternalSelectedCallId(completedCall.id)
    }

    onMarkDoneCall?.(call)
  }

  const isSelectedLive =
    Boolean(selectedCall && selectedCall.id === activeCallId) ||
    Boolean(selectedCall && selectedCall.status === "active")

  return {
    tab,
    selectedCallId,
    activeCallId,
    newIncomingCount,
    activeCallsList,
    selectedCall,
    activeCall,
    isSelectedLive,
    handleTabClick,
    handleSelectCall,
    handleRespondCall,
    handleMarkDoneCall,
  }
}
