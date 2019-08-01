import React, { ReactElement } from "react"
import VehiclesByRouteIdContext from "../contexts/vehiclesByRouteIdContext"
import { VehiclesForRoute } from "../realtime"
import { ByRouteId } from "../schedule"

const VehiclesByRouteIdProvider = ({
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

export default VehiclesByRouteIdProvider
