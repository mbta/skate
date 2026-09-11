import { useReducer, useMemo, useCallback } from "react"
import { RttCall, RttTab } from "./types"
import { sortRttCalls } from "./sorting"
import {
  rttQueueReducer,
  createInitialRttQueueState,
  type RttQueueState,
  type InitialRttQueueState,
} from "./rttQueueReducer"
import { useRttSelection } from "./useRttSelection"
import { useRttQueueTabs } from "./useRttQueueTabs"

export interface RttCallsState {
  incoming: RttCall[]
  past: RttCall[]
  activeList: RttCall[]
  selectedId: string | null
  selected: RttCall | null
  activeId: string | null
  active: RttCall | null
  isSelectedLive: boolean
}

export interface RttTabsState {
  current: RttTab
  newIncomingCount: number
}

export interface RttQueueActions {
  selectCall: (call: RttCall) => void
  respondCall: (call: RttCall) => void
  markDoneCall: (call: RttCall) => void
  receiveCall: (call: RttCall) => void
  changeTab: (tab: RttTab) => void
  reset: (payload?: Partial<RttQueueState>) => void
}

export interface UseRttQueueResult {
  calls: RttCallsState
  tabs: RttTabsState
  actions: RttQueueActions
}

export interface RttQueueCallbacks {
  onSelectCall?: (call: RttCall) => void
  onRespondCall?: (call: RttCall) => void
  onMarkDoneCall?: (call: RttCall) => void
  onTabChange?: (tab: RttTab) => void
}

export interface UseRttQueueOptions extends RttQueueCallbacks {
  initialState?: InitialRttQueueState
  incomingCalls?: RttCall[]
  pastCalls?: RttCall[]
  selectedCallId?: string | null
  activeCallId?: string | null
  currentTab?: RttTab
  newIncomingCount?: number
  currentDispatcherName?: string
}

export const useRttQueue = (options: UseRttQueueOptions = {}) => {
  const [state, dispatch] = useReducer(
    rttQueueReducer,
    {
      tab: options.currentTab ?? options.initialState?.tab,
      incomingCalls:
        options.incomingCalls ?? options.initialState?.incomingCalls,
      pastCalls: options.pastCalls ?? options.initialState?.pastCalls,
      selectedCallId:
        options.selectedCallId !== undefined
          ? options.selectedCallId
          : options.initialState?.selectedCallId,
      activeCallId:
        options.activeCallId !== undefined
          ? options.activeCallId
          : options.initialState?.activeCallId,
      newIncomingCount:
        options.newIncomingCount ?? options.initialState?.newIncomingCount,
    },
    createInitialRttQueueState
  )

  const tab = options.currentTab ?? state.tab
  const incomingCalls = options.incomingCalls ?? state.incomingCalls
  const pastCalls = options.pastCalls ?? state.pastCalls
  const selectedCallId =
    options.selectedCallId !== undefined
      ? options.selectedCallId
      : state.selectedCallId
  const activeCallId =
    options.activeCallId !== undefined
      ? options.activeCallId
      : state.activeCallId
  const newIncomingCount = options.newIncomingCount ?? state.newIncomingCount

  const dispatchTabChange = useCallback((newTab: RttTab) => {
    dispatch({ type: "CHANGE_TAB", tab: newTab })
  }, [])

  const { handleTabClick } = useRttQueueTabs({
    tab,
    newIncomingCount,
    onTabChange: options.onTabChange,
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
      onSelectCall: options.onSelectCall,
      dispatchSelectCall,
    })

  const sortedIncomingCalls = useMemo(
    () => sortRttCalls(incomingCalls),
    [incomingCalls]
  )
  const sortedPastCalls = useMemo(
    () => sortRttCalls(pastCalls, { byPriority: false }),
    [pastCalls]
  )

  const activeCallsList =
    tab === "incoming" ? sortedIncomingCalls : sortedPastCalls

  const { onRespondCall, onMarkDoneCall, currentDispatcherName } = options

  const handleRespondCall = useCallback(
    (call: RttCall) => {
      dispatch({
        type: "RESPOND_CALL",
        call,
        currentDispatcherName: currentDispatcherName ?? "Current Dispatcher",
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

  const calls: RttCallsState = useMemo(
    () => ({
      incoming: incomingCalls,
      past: pastCalls,
      activeList: activeCallsList,
      selectedId: selectedCallId,
      selected: selectedCall,
      activeId: activeCallId,
      active: activeCall,
      isSelectedLive,
    }),
    [
      incomingCalls,
      pastCalls,
      activeCallsList,
      selectedCallId,
      selectedCall,
      activeCallId,
      activeCall,
      isSelectedLive,
    ]
  )

  const tabs: RttTabsState = useMemo(
    () => ({
      current: tab,
      newIncomingCount,
    }),
    [tab, newIncomingCount]
  )

  const actions: RttQueueActions = useMemo(
    () => ({
      selectCall: handleSelectCall,
      respondCall: handleRespondCall,
      markDoneCall: handleMarkDoneCall,
      receiveCall: handleReceiveCall,
      changeTab: handleTabClick,
      reset: handleReset,
    }),
    [
      handleSelectCall,
      handleRespondCall,
      handleMarkDoneCall,
      handleReceiveCall,
      handleTabClick,
      handleReset,
    ]
  )

  return {
    calls,
    tabs,
    actions,
  }
}
