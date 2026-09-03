import { Factory } from "fishery"
import {
  RttCall,
  RttCallType,
  RttStatus,
} from "../../../src/components/radio/rtts/types"

export const rttCallFactory = Factory.define<RttCall>(
  ({ sequence, params }) => {
    const callType: RttCallType =
      params.callType ??
      (sequence % 3 === 0 ? "Emergency" : sequence % 2 === 0 ? "PRTT" : "RTT")
    const status: RttStatus = params.status ?? "unassigned"
    const now = new Date()
    const receivedAt =
      params.receivedAt ?? new Date(now.getTime() - sequence * 60000)

    const garages = [
      "Albany",
      "Cabot",
      "Charlestown",
      "Fellsway",
      "Lynn",
      "Southampton",
    ]

    return {
      id: params.id ?? `rtt-${sequence}`,
      callType,
      talkGroup: params.talkGroup ?? `TG-${100 + (sequence % 5)}`,
      routeId: params.routeId ?? `${((sequence * 7) % 100) + 1}`,
      routeName: params.routeName ?? `${((sequence * 7) % 100) + 1}`,
      vehicleId: params.vehicleId ?? `${1000 + sequence}`,
      garage: params.garage ?? garages[sequence % garages.length],
      receivedAt,
      direction:
        params.direction ?? (sequence % 2 === 0 ? "Outbound" : "Inbound"),
      variant: params.variant ?? "Standard Route",
      currentLocation: params.currentLocation ?? "Washington St @ Mass Ave",
      operatorBadge: params.operatorBadge ?? `${50000 + sequence}`,
      operatorName: params.operatorName ?? `Operator ${sequence}`,
      runNumber: params.runNumber ?? `R-${100 + sequence}`,
      respondedBy:
        params.respondedBy ?? (status === "active" ? "Dispatcher Smith" : null),
      answeredAt:
        params.answeredAt ??
        (status === "active"
          ? new Date(new Date(receivedAt).getTime() + 30000)
          : null),
      markedDoneAt:
        params.markedDoneAt ??
        (status === "done"
          ? new Date(new Date(receivedAt).getTime() + 120000)
          : null),
      status,
    }
  }
)
