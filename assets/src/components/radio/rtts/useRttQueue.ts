import { useReducer, useMemo, useCallback } from "react"
import { RttCall, RttTab, sortRttCalls, sortPastRttCalls } from "./types"
import {
  rttQueueReducer,
  createInitialRttQueueState,
  type RttQueueState,
} from "./rttQueueReducer"
import { useRttSelection } from "./useRttSelection"
import { useRttQueueTabs } from "./useRttQueueTabs"

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

  const dispatchTabChange = useCallback((newTab: RttTab) => {
    dispatch({ type: "CHANGE_TAB", tab: newTab })
  }, [])

  const { handleTabClick } = useRttQueueTabs({
    tab,
    newIncomingCount,
    onTabChange,
    dispatchTabChange,
  })

  const dispatchSelectCall = useCallback((callId: string) => {
    dispatch({ type: "SELECT_CALL", callId })
  }, [])

  const { selectedCall, activeCall, isSelectedLive, handleSelectCall } =
    useRttSelection({
      selectedCallId,
      activeCallId,
      incomingCalls,
      pastCalls,
      onSelectCall,
      dispatchSelectCall,
    })

  const sortedIncomingCalls = useMemo(
    () => sortRttCalls(incomingCalls),
    [incomingCalls]
  )
  const sortedPastCalls = useMemo(
    () => sortPastRttCalls(pastCalls),
    [pastCalls]
  )

  const activeCallsList =
    tab === "incoming" ? sortedIncomingCalls : sortedPastCalls

  const handleRespondCall = useCallback(
    (call: RttCall) => {
      dispatch({
        type: "RESPOND_CALL",
        call,
        currentDispatcherName,
      })
      onRespondCall?.(call)
    },
    [currentDispatcherName, onRespondCall]
  )

  const handleMarkDoneCall = useCallback(
    (call: RttCall) => {
      dispatch({ type: "MARK_DONE_CALL", call })
      onMarkDoneCall?.(call)
    },
    [onMarkDoneCall]
  )

  const handleReceiveCall = useCallback((call: RttCall) => {
    dispatch({ type: "RECEIVE_CALL", call })
  }, [])

  const handleReset = useCallback((payload?: Partial<RttQueueState>) => {
    dispatch({ type: "RESET", payload })
  }, [])

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
