import React, { createContext, ReactElement } from "react"
import { VehicleOrGhost } from "../realtime"
import { ByRouteId } from "../schedule"

export const VehiclesByRouteIdContext = createContext(
  {} as ByRouteId<VehicleOrGhost[]>
)

export const VehiclesByRouteIdProvider = ({
  vehiclesByRouteId,
  children,
}: {
  vehiclesByRouteId: ByRouteId<VehicleOrGhost[]>
  children: ReactElement<HTMLElement>
}) => {
  return (
    <VehiclesByRouteIdContext.Provider value={vehiclesByRouteId}>
      {children}
    </VehiclesByRouteIdContext.Provider>
  )
}
