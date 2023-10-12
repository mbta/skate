import { Socket } from "phoenix"
import React, {
  Dispatch,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { flatten } from "../helpers/array"
import { useRouteShapes } from "../hooks/useShapes"
import useShuttleVehicles from "../hooks/useShuttleVehicles"
import { useStations } from "../hooks/useStations"
import useTrainVehicles from "../hooks/useTrainVehicles"
import { isASubwayRoute } from "../models/subwayRoute"
import { Ghost, RunId, TrainVehicle, Vehicle, VehicleId } from "../realtime"
import { ByRouteId, RouteId, Shape } from "../schedule"
import { selectVehicle } from "../state"
import Map, { vehicleToLeafletLatLng } from "./map"
import ShuttlePicker from "./shuttlePicker"
import { LayersControl, LayersControlState } from "./map/controls/layersControl"
import { setTileType } from "../state/mapLayersState"
import { TileType } from "../tilesetUrls"
import { UserLocationControl } from "./map/controls/userLocationControl"
import {
  InterruptibleFollower,
  useInteractiveFollowerState,
  usePickerContainerFollowerFn,
} from "./map/follower"
import { RecenterControl } from "./map/controls/recenterControl"
import UserLocationMarker from "./map/markers/userLocationMarker"
import { latLng } from "leaflet"
import useGeolocation from "../hooks/useGeolocation"

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
  const stations = useStations()
  const shapes: Shape[] = useRouteShapes(
    selectedShuttleRouteIds,
    stations || undefined
  )

  const selectedSubwayRouteIds: RouteId[] =
    selectedShuttleRouteIds.filter(isASubwayRoute)
  const trainVehiclesByRouteId = useTrainVehicles(
    socket,
    selectedSubwayRouteIds
  )
  const trainVehicles: TrainVehicle[] = allTrainVehicles(trainVehiclesByRouteId)

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  const selectedShuttles: Vehicle[] = filterShuttles(
    shuttles || [],
    selectedShuttleRunIds
  )

  return (
    <div className={`c-shuttle-map ${mobileMenuClass}`}>
      <ShuttlePicker shuttles={shuttles} />
      <ShuttleMap
        selectedShuttles={selectedShuttles}
        selectedShuttleRunIds={selectedShuttleRunIds}
        selectedVehicleId={selectedVehicleOrGhost?.id}
        selectedRouteShapes={shapes}
        trainVehicles={trainVehicles}
        tileType={tileType}
        setTileType={(tileType) =>
          dispatch(setTileType("shuttleMap", tileType))
        }
        selectVehicle={(vehicle) => dispatch(selectVehicle(vehicle))}
      />
    </div>
  )
}

interface ShuttleMapProps {
  // TODO: revisit this prop
  selectedShuttleRunIds: RunId[] | "all"
  //
  selectedVehicleId?: VehicleId
  selectedShuttles: Vehicle[]
  selectedRouteShapes?: Shape[]
  trainVehicles?: TrainVehicle[]
  tileType?: TileType
  setTileType: (tileType: TileType) => void
  selectVehicle: (vehicle: Vehicle | Ghost) => void
}

export const ShuttleMap = ({
  selectedShuttles,
  selectedShuttleRunIds,
  selectedVehicleId,
  selectedRouteShapes,
  trainVehicles,
  selectVehicle,
  tileType,
  setTileType,
}: ShuttleMapProps) => {
  const vehiclePositions = selectedShuttles.map(vehicleToLeafletLatLng)

  type FollowerController = false | "user-location" | "vehicle-location"
  const [followerController, setFollowerController] =
    useState<FollowerController>("vehicle-location")

  const state = useInteractiveFollowerState(),
    { setShouldFollow: setFollowActive } = state

  const setShouldFollow = useCallback(
    (controller: FollowerController) => {
      setFollowerController(controller)
      setFollowActive(controller !== false ? true : false)
    },
    [setFollowerController, setFollowActive]
  )

  const [userLocation, setUserLocation] =
    useState<null | GeolocationCoordinates>(null)

  const followPositions = useMemo(
    () =>
      followerController
        ? {
            "user-location": userLocation
              ? [latLng(userLocation.latitude, userLocation.longitude)]
              : [],
            "vehicle-location": vehiclePositions,
          }[followerController]
        : [],
    [followerController, userLocation, vehiclePositions]
  )

  // Enable follower when
  // - we're not currently following the device location
  // and
  // - the `selectedShuttleRunIds` change referential equality
  // CLEANUP: replace with `useEffectEvent` once stabilized
  //    https://react.dev/reference/react/experimental_useEffectEvent
  const [currentShuttleRunIds, setCurrentShuttleRunIds] = useState(
    selectedShuttleRunIds
  )
  useEffect(() => {
    if (currentShuttleRunIds !== selectedShuttleRunIds) {
      setCurrentShuttleRunIds(selectedShuttleRunIds)

      if (followerController === false) {
        setShouldFollow("vehicle-location")
      }
    }
  }, [
    selectedShuttleRunIds,
    currentShuttleRunIds,
    followerController,
    setShouldFollow,
  ])

  const followerFn = usePickerContainerFollowerFn()

  return (
    <div className="c-shuttle-map__map">
      <Map
        vehicles={selectedShuttles}
        selectedVehicleId={selectedVehicleId}
        shapes={selectedRouteShapes}
        trainVehicles={trainVehicles}
        onPrimaryVehicleSelect={selectVehicle}
        tileType={tileType}
      >
        <LayersControlState>
          {(open, setOpen) => (
            <LayersControl.WithTileContext
              showLayersList={open}
              onChangeLayersListVisibility={setOpen}
              onChangeTileType={setTileType}
            />
          )}
        </LayersControlState>

        <UserLocationControl
          title="Show your current location"
          onClick={() => {
            setShouldFollow("user-location")
          }}
          disabled={followerController == "user-location"}
        />
        <RecenterControl
          position="topright"
          active={followerController == "vehicle-location"}
          onActivate={() => setShouldFollow("vehicle-location")}
        />

        <>
          {(followerController === "user-location" || userLocation) && (
            <UserLocation onLocationUpdate={setUserLocation} />
          )}
        </>
        <>{userLocation && <UserLocationMarker location={userLocation} />}</>

        <InterruptibleFollower
          {...state}
          setShouldFollow={(shouldFollow) => {
            shouldFollow === false && setShouldFollow(false)
          }}
          positions={followPositions}
          onUpdate={followerFn}
        />
      </Map>
    </div>
  )
}

interface UserLocationProps {
  onLocationUpdate: Dispatch<GeolocationCoordinates | null>
}
const UserLocation = ({ onLocationUpdate }: UserLocationProps) => {
  const location = useGeolocation()
  useEffect(() => {
    onLocationUpdate(location)
  }, [onLocationUpdate, location])
  return null
}

export default ShuttleMapPage
