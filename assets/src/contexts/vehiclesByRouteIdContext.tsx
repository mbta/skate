import React, { createContext, ReactElement } from "react"
import { VehicleInScheduledService, Ghost } from "../realtime"
import { ByRouteId } from "../schedule"

export const VehiclesByRouteIdContext = createContext(
  {} as ByRouteId<(VehicleInScheduledService | Ghost)[]>
)

export const VehiclesByRouteIdProvider = ({
  vehiclesByRouteId,
  children,
}: {
  vehiclesByRouteId: ByRouteId<(VehicleInScheduledService | Ghost)[]>
  children: ReactElement<HTMLElement>
}) => {
  return (
    <VehiclesByRouteIdContext.Provider value={vehiclesByRouteId}>
      {children}
    </VehiclesByRouteIdContext.Provider>
  )
}
