import { Socket } from "phoenix"
import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { flatten } from "../helpers/array"
import { useRouteShapes } from "../hooks/useShapes"
import useShuttleVehicles from "../hooks/useShuttleVehicles"
import useTrainVehicles from "../hooks/useTrainVehicles"
import { isASubwayRoute } from "../models/subwayRoute"
import { RunId, TrainVehicle, Vehicle } from "../realtime"
import { ByRouteId, RouteId, Shape } from "../schedule"
import Map from "./map"
import RightPanel from "./rightPanel"
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

const ShuttleMapPage = ({}): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const {
    selectedShuttleRouteIds,
    selectedShuttleRunIds,
    selectedVehicleOrGhost,
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

      <RightPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
    </div>
  )
}

export default ShuttleMapPage
