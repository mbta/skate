import { RttCall, RttTab } from "./types"

export interface RttQueueState {
  tab: RttTab
  incomingCalls: RttCall[]
  pastCalls: RttCall[]
  selectedCallId: string | null
  activeCallId: string | null
  newIncomingCount: number
}

export type RttQueueAction =
  | { type: "CHANGE_TAB"; tab: RttTab }
  | { type: "SELECT_CALL"; callId: string }
  | {
      type: "RESPOND_CALL"
      call: RttCall
      currentDispatcherName?: string
      answeredAt?: Date
    }
  | { type: "MARK_DONE_CALL"; call: RttCall; markedDoneAt?: Date }
  | { type: "RECEIVE_CALL"; call: RttCall }
  | {
      type: "RESET"
      payload?: Partial<RttQueueState>
    }

export interface InitialRttQueueStateOptions {
  tab?: RttTab
  incomingCalls?: RttCall[]
  pastCalls?: RttCall[]
  selectedCallId?: string | null
  activeCallId?: string | null
  newIncomingCount?: number
}

export const createInitialRttQueueState = (
  options: InitialRttQueueStateOptions = {}
): RttQueueState => ({
  tab: options.tab ?? "incoming",
  incomingCalls: options.incomingCalls ?? [],
  pastCalls: options.pastCalls ?? [],
  selectedCallId: options.selectedCallId ?? null,
  activeCallId: options.activeCallId ?? null,
  newIncomingCount: options.newIncomingCount ?? 0,
})

export const rttQueueReducer = (
  state: RttQueueState,
  action: RttQueueAction
): RttQueueState => {
  switch (action.type) {
    case "CHANGE_TAB": {
      return {
        ...state,
        tab: action.tab,
        newIncomingCount:
          action.tab === "incoming" ? 0 : state.newIncomingCount,
      }
    }

    case "SELECT_CALL": {
      return {
        ...state,
        selectedCallId: action.callId,
      }
    }

    case "RESPOND_CALL": {
      const now = action.answeredAt ?? new Date()
      const currentActiveId = state.activeCallId
      const targetCall = action.call
      const dispatcher = action.currentDispatcherName ?? "Current Dispatcher"

      let newPastCalls = state.pastCalls
      if (currentActiveId && currentActiveId !== targetCall.id) {
        const priorCall = state.incomingCalls.find(
          (c) => c.id === currentActiveId
        )
        if (priorCall) {
          const completed: RttCall = {
            ...priorCall,
            status: "done",
            markedDoneAt: now,
          }
          newPastCalls = [completed, ...newPastCalls]
        }
      }

      const newIncomingCalls = state.incomingCalls
        .filter(
          (c) =>
            !(
              currentActiveId &&
              c.id === currentActiveId &&
              c.id !== targetCall.id
            )
        )
        .map((c) => {
          if (c.id === targetCall.id) {
            return {
              ...c,
              status: "active" as const,
              respondedBy: dispatcher,
              answeredAt: now,
            }
          }
          return c
        })

      return {
        ...state,
        incomingCalls: newIncomingCalls,
        pastCalls: newPastCalls,
        activeCallId: targetCall.id,
        selectedCallId: targetCall.id,
      }
    }

    case "MARK_DONE_CALL": {
      const now = action.markedDoneAt ?? new Date()
      const targetCall = action.call
      const completedCall: RttCall = {
        ...targetCall,
        status: "done",
        markedDoneAt: now,
      }

      return {
        ...state,
        incomingCalls: state.incomingCalls.filter(
          (c) => c.id !== targetCall.id
        ),
        pastCalls: [completedCall, ...state.pastCalls],
        activeCallId:
          state.activeCallId === targetCall.id ? null : state.activeCallId,
        selectedCallId:
          state.selectedCallId === targetCall.id
            ? completedCall.id
            : state.selectedCallId,
      }
    }

    case "RECEIVE_CALL": {
      return {
        ...state,
        incomingCalls: [action.call, ...state.incomingCalls],
        newIncomingCount:
          state.tab === "past"
            ? state.newIncomingCount + 1
            : state.newIncomingCount,
      }
    }

    case "RESET": {
      return {
        ...state,
        ...action.payload,
      }
    }

    default:
      return state
  }
}
