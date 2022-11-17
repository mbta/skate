import React, { ReactElement } from "react"
import { Vehicle } from "../realtime"
import StreetViewButton from "./streetViewButton"

const VehicleCard = ({
  vehicle,
}: {
  vehicle: Vehicle
}): ReactElement<HTMLElement> => {
  return (
    <div className="vehicle-card">
      <StreetViewButton
        latitude={vehicle.latitude}
        longitude={vehicle.longitude}
        bearing={vehicle.bearing}
      />
    </div>
  )
}
export default VehicleCard
