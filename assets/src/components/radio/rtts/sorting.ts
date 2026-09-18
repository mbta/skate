import { RttCall, RttCallType } from "./types"

export const CALL_TYPE_PRIORITY: Record<RttCallType, number> = {
  Emergency: 1,
  PRTT: 2,
  RTT: 3,
}

export const getCallTimestamp = (dateOrStr: Date | string): number =>
  typeof dateOrStr === "string"
    ? new Date(dateOrStr).getTime()
    : dateOrStr.getTime()

export interface SortRttCallsOptions {
  byPriority?: boolean
}

/**
 * Sorts RTT calls in reverse chronological order (newest first).
 * When `byPriority` is true (default), calls are sorted first by call type priority
 * (Emergency > PRTT > RTT), and then by received timestamp.
 */
export const sortRttCalls = (
  calls: RttCall[],
  { byPriority = true }: SortRttCallsOptions = {}
): RttCall[] => {
  return [...calls].sort((a, b) => {
    if (byPriority) {
      const priorityDiff =
        CALL_TYPE_PRIORITY[a.callType] - CALL_TYPE_PRIORITY[b.callType]
      if (priorityDiff !== 0) {
        return priorityDiff
      }
    }
    return getCallTimestamp(b.receivedAt) - getCallTimestamp(a.receivedAt)
  })
}
