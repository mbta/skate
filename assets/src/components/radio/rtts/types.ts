export type RttCallType = "Emergency" | "PRTT" | "RTT"

export type RttTab = "incoming" | "past"

export const TAB_TYPE = {
  INCOMING: "incoming",
  PAST: "past",
} as const satisfies Record<string, RttTab>

export const DEFAULT_DISPATCHER_NAME = "Current Dispatcher"

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
  adherence?: string
  respondedBy?: string | null
  answeredAt?: Date | string | null
  markedDoneAt?: Date | string | null
  status: RttStatus
}
