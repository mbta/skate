export type RttCallType = "Emergency" | "PRTT" | "RTT"

export type RttTab = "incoming" | "past"

export type RttStatus = "unassigned" | "active" | "done"

export interface RttCall {
  id: string
  callType: RttCallType
  talkGroup: string
  routeId: string
  routeName: string
  vehicleId: string
  garage?: string
  receivedAt: Date | string
  direction?: string
  variant?: string
  currentLocation?: string
  operatorBadge?: string
  operatorName?: string
  runNumber?: string
  respondedBy?: string | null
  answeredAt?: Date | string | null
  markedDoneAt?: Date | string | null
  status: RttStatus
}

export const CALL_TYPE_PRIORITY: Record<RttCallType, number> = {
  Emergency: 1,
  PRTT: 2,
  RTT: 3,
}

/**
 * Sorts RTT calls by:
 * 1. Priority: Emergency > PRTT > RTT
 * 2. Received timestamp: Newest to oldest (chronological order)
 */
export const sortRttCalls = (calls: RttCall[]): RttCall[] => {
  return [...calls].sort((a, b) => {
    const priorityDiff =
      CALL_TYPE_PRIORITY[a.callType] - CALL_TYPE_PRIORITY[b.callType]
    if (priorityDiff !== 0) {
      return priorityDiff
    }
    const timeA = new Date(a.receivedAt).getTime()
    const timeB = new Date(b.receivedAt).getTime()
    return timeB - timeA
  })
}
