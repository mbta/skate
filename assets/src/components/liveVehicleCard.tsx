import { Socket } from "phoenix"
import React, { useContext } from "react"
import { ReactElement } from "react"
import { SocketContext } from "../contexts/socketContext"
import useVehicleForId from "../hooks/useVehicleForId"
import { isVehicle } from "../models/vehicle"
import { Vehicle } from "../realtime"
import VehicleCard from "./vehicleCard"

const LiveVehicleCard = ({
  vehicle: staticVehicle,
  onClose,
}: {
  vehicle: Vehicle
  onClose: () => void
}): ReactElement<HTMLElement> | null => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const liveVehicle = useVehicleForId(socket, staticVehicle.id)
  const vehicleToDisplay: Vehicle | null =
    liveVehicle && isVehicle(liveVehicle) ? liveVehicle : null

  if (vehicleToDisplay) {
    return <VehicleCard vehicle={vehicleToDisplay} onClose={onClose} />
  }
  return null
}

export default LiveVehicleCard
