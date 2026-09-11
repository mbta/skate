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
  adherence?: string
  respondedBy?: string | null
  answeredAt?: Date | string | null
  markedDoneAt?: Date | string | null
  status: RttStatus
}
