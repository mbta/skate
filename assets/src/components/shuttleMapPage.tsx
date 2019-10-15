import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useRouteShapes from "../hooks/useRouteShapes"
import { loadedShapes } from "../models/shape"
import { RunId, Vehicle, VehicleId } from "../realtime"
import { Shape } from "../schedule"
import Map from "./map"
import PropertiesPanel from "./propertiesPanel"
import ShuttlePicker from "./shuttlePicker"

const filterShuttles = (
  shuttles: Vehicle[],
  selectedShuttleRunIds: RunId[] | "all"
): Vehicle[] => {
  if (selectedShuttleRunIds === "all") {
    return shuttles
  }

  return shuttles.filter(shuttle =>
    selectedShuttleRunIds.includes(shuttle.runId!)
  )
}

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
  const shuttleRouteShapesByRouteId = useRouteShapes(selectedShuttleRouteIds)
  const shapes: Shape[] = loadedShapes(
    shuttleRouteShapesByRouteId,
    selectedShuttleRouteIds
  )
  const selectedShuttles: Vehicle[] = filterShuttles(
    shuttles || [],
    selectedShuttleRunIds
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
        <Map vehicles={selectedShuttles} shapes={shapes} />
      </div>

      {selectedVehicle && (
        <PropertiesPanel selectedVehicleOrGhost={selectedVehicle} />
      )}
    </div>
  )
}

export default ShuttleMapPage
