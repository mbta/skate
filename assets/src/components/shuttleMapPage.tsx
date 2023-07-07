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
import { selectVehicle } from "../state"
import { MapFollowingSelectionKey } from "./map"
import ShuttlePicker from "./shuttlePicker"
import { LayersControl } from "./map/controls/layersControl"
import { setTileType } from "../state/mapLayersState"
import { TileType } from "../tilesetUrls"

const filterShuttles = (
  shuttles: Vehicle[],
  selectedShuttleRunIds: RunId[] | "all"
): Vehicle[] => {
  if (selectedShuttleRunIds === "all") {
    return shuttles
  }

  return shuttles.filter((shuttle) =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    selectedShuttleRunIds.includes(shuttle.runId!)
  )
}

export const allTrainVehicles = (
  trainVehiclesByRouteId: ByRouteId<TrainVehicle[]>
): TrainVehicle[] => flatten(Object.values(trainVehiclesByRouteId))

const ShuttleMapPage = (): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const {
    selectedVehicleOrGhost,
    selectedShuttleRouteIds,
    selectedShuttleRunIds,
    mobileMenuIsOpen,
    mapLayers: {
      shuttleMap: { tileType: tileType },
    },
  } = state
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const shuttles: Vehicle[] | null = useShuttleVehicles(socket)
  const shapes: Shape[] = useRouteShapes(selectedShuttleRouteIds)

  const selectedSubwayRouteIds: RouteId[] =
    selectedShuttleRouteIds.filter(isASubwayRoute)
  const trainVehiclesByRouteId = useTrainVehicles(
    socket,
    selectedSubwayRouteIds
  )
  const trainVehicles: TrainVehicle[] = allTrainVehicles(trainVehiclesByRouteId)

  const selectedShuttles: Vehicle[] = filterShuttles(
    shuttles || [],
    selectedShuttleRunIds
  )

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  const followerResetKey =
    selectedShuttleRunIds === "all" ? "all" : selectedShuttleRunIds.join(",")

  return (
    <div className={`c-shuttle-map ${mobileMenuClass}`}>
      <ShuttlePicker shuttles={shuttles} />

      <div className="c-shuttle-map__map">
        <MapFollowingSelectionKey
          selectedVehicleId={selectedVehicleOrGhost?.id}
          vehicles={selectedShuttles}
          shapes={shapes}
          trainVehicles={trainVehicles}
          onPrimaryVehicleSelect={(vehicle) => dispatch(selectVehicle(vehicle))}
          selectionKey={followerResetKey}
        >
          <LayersControl
            tileType={tileType}
            setTileType={(tileType: TileType) =>
              dispatch(setTileType("shuttleMap", tileType))
            }
          />
        </MapFollowingSelectionKey>
      </div>
    </div>
  )
}

export default ShuttleMapPage
