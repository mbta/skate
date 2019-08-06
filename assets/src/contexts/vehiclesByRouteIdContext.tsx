import React, { createContext, ReactElement } from "react"
import { VehiclesForRoute } from "../realtime"
import { ByRouteId } from "../schedule"

export const VehiclesByRouteIdContext = createContext({} as ByRouteId<
  VehiclesForRoute
>)

export const VehiclesByRouteIdProvider = ({
  vehiclesByRouteId,
  children,
}: {
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>
  children: ReactElement<HTMLElement>
}) => {
  return (
    <VehiclesByRouteIdContext.Provider value={vehiclesByRouteId}>
      {children}
    </VehiclesByRouteIdContext.Provider>
  )
}

export default VehiclesByRouteIdContext
