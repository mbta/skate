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

export interface UseRttQueueProps extends RttQueueCallbacks {
  initialState?: InitialRttQueueState
  incomingCalls?: RttCall[]
  pastCalls?: RttCall[]
  selectedCallId?: string | null
  activeCallId?: string | null
  currentTab?: RttTab
  newIncomingCount?: number
  currentDispatcherName?: string
}

export const useRttQueue = (props: UseRttQueueProps = {}) => {
  const {
    initialState,
    currentDispatcherName = "Current Dispatcher",
    onSelectCall,
    onRespondCall,
    onMarkDoneCall,
    onTabChange,
  } = props

  const [state, dispatch] = useReducer(
    rttQueueReducer,
    {
      tab: props.currentTab ?? initialState?.tab,
      incomingCalls: props.incomingCalls ?? initialState?.incomingCalls,
      pastCalls: props.pastCalls ?? initialState?.pastCalls,
      selectedCallId:
        props.selectedCallId !== undefined
          ? props.selectedCallId
          : initialState?.selectedCallId,
      activeCallId:
        props.activeCallId !== undefined
          ? props.activeCallId
          : initialState?.activeCallId,
      newIncomingCount:
        props.newIncomingCount ?? initialState?.newIncomingCount,
    },
    createInitialRttQueueState
  )

  const tab = props.currentTab ?? state.tab
  const incomingCalls = props.incomingCalls ?? state.incomingCalls
  const pastCalls = props.pastCalls ?? state.pastCalls
  const selectedCallId =
    props.selectedCallId !== undefined
      ? props.selectedCallId
      : state.selectedCallId
  const activeCallId =
    props.activeCallId !== undefined ? props.activeCallId : state.activeCallId
  const newIncomingCount = props.newIncomingCount ?? state.newIncomingCount

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
    () => sortRttCalls(pastCalls, { byPriority: false }),
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
