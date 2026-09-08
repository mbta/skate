import { useReducer, useMemo } from "react"
import { RttCall, RttTab, sortRttCalls } from "./types"
import {
  rttQueueReducer,
  createInitialRttQueueState,
  type RttQueueState,
} from "./rttQueueReducer"

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
  const [state, dispatch] = useReducer(
    rttQueueReducer,
    {
      incomingCalls: incomingCallsProp ?? defaultIncomingCalls ?? [],
      pastCalls: pastCallsProp ?? defaultPastCalls ?? [],
      selectedCallId: selectedCallIdProp ?? defaultSelectedCallId ?? null,
      activeCallId: activeCallIdProp ?? defaultActiveCallId ?? null,
      tab: currentTabProp ?? defaultTab ?? "incoming",
      newIncomingCount: newIncomingCountProp ?? 0,
    },
    createInitialRttQueueState
  )

  const tab = currentTabProp !== undefined ? currentTabProp : state.tab
  const incomingCalls =
    incomingCallsProp !== undefined ? incomingCallsProp : state.incomingCalls
  const pastCalls =
    pastCallsProp !== undefined ? pastCallsProp : state.pastCalls
  const selectedCallId =
    selectedCallIdProp !== undefined ? selectedCallIdProp : state.selectedCallId
  const activeCallId =
    activeCallIdProp !== undefined ? activeCallIdProp : state.activeCallId
  const newIncomingCount =
    newIncomingCountProp !== undefined
      ? newIncomingCountProp
      : state.newIncomingCount

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
    dispatch({ type: "CHANGE_TAB", tab: newTab })
    onTabChange?.(newTab)
  }

  const handleSelectCall = (call: RttCall) => {
    dispatch({ type: "SELECT_CALL", callId: call.id })
    onSelectCall?.(call)
  }

  const handleRespondCall = (call: RttCall) => {
    dispatch({
      type: "RESPOND_CALL",
      call,
      currentDispatcherName,
    })
    onRespondCall?.(call)
  }

  const handleMarkDoneCall = (call: RttCall) => {
    dispatch({ type: "MARK_DONE_CALL", call })
    onMarkDoneCall?.(call)
  }

  const handleReceiveCall = (call: RttCall) => {
    dispatch({ type: "RECEIVE_CALL", call })
  }

  const handleReset = (payload?: Partial<RttQueueState>) => {
    dispatch({ type: "RESET", payload })
  }

  const isSelectedLive =
    Boolean(selectedCall && selectedCall.id === activeCallId) ||
    Boolean(selectedCall && selectedCall.status === "active")

  return {
    state,
    dispatch,
    tab,
    selectedCallId,
    activeCallId,
    newIncomingCount,
    incomingCalls,
    pastCalls,
    activeCallsList,
    selectedCall,
    activeCall,
    isSelectedLive,
    handleTabClick,
    handleSelectCall,
    handleRespondCall,
    handleMarkDoneCall,
    handleReceiveCall,
    handleReset,
  }
}
