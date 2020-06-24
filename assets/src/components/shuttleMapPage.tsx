import { Socket } from "phoenix"
import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { flatten } from "../helpers/array"
import { useRouteShapes } from "../hooks/useShapes"
import useShuttleVehicles from "../hooks/useShuttleVehicles"
import useTrainVehicles from "../hooks/useTrainVehicles"
import { isASubwayRoute } from "../models/subwayRoute"
import { RunId, TrainVehicle, Vehicle, VehicleId } from "../realtime"
import { ByRouteId, RouteId, Shape } from "../schedule"
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

  return shuttles.filter((shuttle) =>
    selectedShuttleRunIds.includes(shuttle.runId!)
  )
}

export const allTrainVehicles = (
  trainVehiclesByRouteId: ByRouteId<TrainVehicle[]>
): TrainVehicle[] => flatten(Object.values(trainVehiclesByRouteId))

const findSelectedVehicle = (
  vehicles: Vehicle[],
  selectedVehicleId: VehicleId | undefined
): Vehicle | undefined =>
  vehicles.find((vehicle) => vehicle.id === selectedVehicleId)

const ShuttleMapPage = ({}): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const {
    selectedShuttleRouteIds,
    selectedShuttleRunIds,
    selectedVehicleId,
  } = state
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const shuttles: Vehicle[] | null = useShuttleVehicles(socket)
  const shapes: Shape[] = useRouteShapes(selectedShuttleRouteIds)

  const selectedSubwayRouteIds: RouteId[] = selectedShuttleRouteIds.filter(
    isASubwayRoute
  )
  const trainVehiclesByRouteId = useTrainVehicles(
    socket,
    selectedSubwayRouteIds
  )
  const trainVehicles: TrainVehicle[] = allTrainVehicles(trainVehiclesByRouteId)

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
      <ShuttlePicker shuttles={shuttles} />

      <div className="m-shuttle-map__map">
        <Map
          vehicles={selectedShuttles}
          shapes={shapes}
          trainVehicles={trainVehicles}
        />
      </div>

      {selectedVehicle && (
        <PropertiesPanel selectedVehicleOrGhost={selectedVehicle} />
      )}
    </div>
  )
}

export default ShuttleMapPage
