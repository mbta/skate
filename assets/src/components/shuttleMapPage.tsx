import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useRouteShapes from "../hooks/useRouteShapes"
import { Vehicle, VehicleId } from "../realtime"
import Map from "./map"
import ShuttlePicker from "./shuttlePicker"
import VehiclePropertiesPanel from "./vehiclePropertiesPanel"

const findSelectedVehicle = (
  vehicles: Vehicle[],
  selectedVehicleId: VehicleId | undefined
): Vehicle | undefined =>
  vehicles.find(vehicle => vehicle.id === selectedVehicleId)

const ShuttleMapPage = ({}): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const {
    selectedShuttleRouteIds,
    selectedShuttleRunIds,
    selectedVehicleId,
  } = state
  const shuttles: Vehicle[] | null = useContext(ShuttleVehiclesContext)
  const shapesByRouteId = useRouteShapes(selectedShuttleRouteIds)
  const selectedShuttles: Vehicle[] = (shuttles || []).filter(shuttle =>
    selectedShuttleRunIds.includes(shuttle.runId!)
  )
  const selectedVehicle = findSelectedVehicle(
    selectedShuttles,
    selectedVehicleId
  )

  return (
    <div className="m-shuttle-map">
      <ShuttlePicker />

      <div
        className="m-shuttle-map__map"
        style={{
          height: window.innerHeight,
          width: window.innerWidth,
        }}
      >
        <Map
          vehicles={selectedShuttles}
          centerOnVehicle={null}
          initialZoom={13}
          shapesByRouteId={shapesByRouteId}
        />
      </div>

      {selectedVehicle && (
        <VehiclePropertiesPanel selectedVehicle={selectedVehicle} />
      )}
    </div>
  )
}

export default ShuttleMapPage
