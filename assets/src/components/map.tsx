import Leaflet, {
  Bounds,
  Control,
  ControlOptions,
  DomUtil,
  LatLng,
  LatLngExpression,
  LatLngLiteral,
  Map as LeafletMap,
  Point,
} from "leaflet"

import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import "leaflet.fullscreen"
import React, {
  Dispatch,
  MutableRefObject,
  ReactElement,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  AttributionControl,
  MapContainer,
  Pane,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet"
import { createControlComponent } from "@react-leaflet/core"

import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import { TrainVehicle, Vehicle, VehicleId } from "../realtime.d"
import { Shape, Stop } from "../schedule"
import { equalByElements } from "../helpers/array"
import inTestGroup, { TestGroups } from "../userInTestGroup"
import {
  GarageMarkers,
  RouteShape,
  RouteStopMarkers,
  StationMarker,
  TrainVehicleMarker,
  VehicleMarker,
} from "./mapMarkers"
import ZoomLevelWrapper from "./ZoomLevelWrapper"
import { StreetViewControl } from "./map/controls/StreetViewSwitch"
import StreetViewModeEnabledContext from "../contexts/streetViewModeEnabledContext"
import { TileType, tilesetUrlForType } from "../tilesetUrls"
import { TileTypeContext } from "../contexts/tileTypeContext"
import getMapLimits from "../mapLimits"

export interface Props {
  reactLeafletRef?: MutableRefObject<LeafletMap | null>
  children?: ReactElement | ReactElement[]
  tileType?: TileType
  stateClasses?: string

  onPrimaryVehicleSelect?: (vehicle: Vehicle) => void
  selectedVehicleId?: VehicleId
  vehicles: Vehicle[]
  // secondaryVehicles are smaller, deemphasized, and don't affect follower in `MapFollowingPrimaryVehicles`
  secondaryVehicles?: Vehicle[]
  // trainVehicles are white, don't get a label, and don't affect follower in `MapFollowingPrimaryVehicles`
  trainVehicles?: TrainVehicle[]
  shapes?: Shape[]
  allowStreetView?: boolean
  streetViewInitiallyEnabled?: boolean
  allowFullscreen?: boolean
  includeStopCard?: boolean
  stations?: Stop[] | null
}

export const defaultCenter: LatLngLiteral = {
  lat: 42.360718,
  lng: -71.05891,
}

interface RecenterControlProps extends ControlOptions {
  recenter: () => void
}

class LeafletRecenterControl extends Control {
  private recenter: () => void
  constructor(props: ControlOptions, recenter: () => void) {
    super(props)
    this.recenter = recenter
  }

  onAdd() {
    const controlContainer = DomUtil.create(
      "div",
      "leaflet-control leaflet-bar c-vehicle-map__recenter-button"
    )
    controlContainer.onclick = (e) => {
      e.stopPropagation()
      e.preventDefault()

      window.FS?.event("Recenter control clicked")

      this.recenter()
    }
    controlContainer.innerHTML = `
		<a
		  href="#"
		  title="Recenter Map"
		  role="button"
		  aria-label="Recenter Map"
		    >
		    <svg
			height="26"
			viewBox="-5 -5 32 32"
			width="26"
			xmlns="http://www.w3.org/2000/svg"
			>
			<path
			     d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
			     transform="rotate(60, 12, 12)"
			/>
		    </svg>
		</a>`
    return controlContainer
  }
}

export const RecenterControl = createControlComponent(
  ({ position: position, recenter: recenterFn }: RecenterControlProps) =>
    new LeafletRecenterControl({ position: position }, recenterFn)
)

export const FullscreenControl = createControlComponent(
  Leaflet.control.fullscreen
)

const EventAdder = (): ReactElement => {
  useMapEvents({
    popupopen: (e) => setTimeout(() => (e.popup.options.autoPan = false), 100),

    popupclose: (e) => (e.popup.options.autoPan = true),
  })
  return <></>
}

// #region Auto Center Functionality
export type UpdateMapFromPointsFn = (map: LeafletMap, points: LatLng[]) => void

export interface FollowerProps {
  positions: LatLng[]
  onUpdate: UpdateMapFromPointsFn
}

export const Follower = ({
  positions,
  onUpdate,
  isAnimatingFollowUpdate,
  shouldFollow = true,
}: FollowerProps & InteractiveFollowState) => {
  const map = useMap()
  const [currentLatLngs, setCurrentLatLngs] = useState<LatLng[]>(positions)

  if (
    !equalByElements(positions, currentLatLngs, (lhs, rhs) => lhs.equals(rhs))
  ) {
    setCurrentLatLngs(positions)
  }

  useEffect(() => {
    if (map !== null && shouldFollow) {
      if (isAnimatingFollowUpdate !== undefined) {
        isAnimatingFollowUpdate.current = true
      }
      onUpdate(map, currentLatLngs)
    }
  }, [map, shouldFollow, isAnimatingFollowUpdate, currentLatLngs, onUpdate])

  return <></>
}
export interface InteractiveFollowState {
  isAnimatingFollowUpdate: MutableRefObject<boolean>
  shouldFollow: boolean
  setShouldFollow: Dispatch<SetStateAction<boolean>>
}

// Gathers all state needed for the Follower to be able to display it's state
// as well as support turning off when interrupted
export const useInteractiveFollowerState = (): InteractiveFollowState => {
  const [shouldFollow, setShouldFollow] = useState<boolean>(true)
  const isAnimatingFollowUpdate: MutableRefObject<boolean> = useRef(false)

  return {
    shouldFollow,
    setShouldFollow,
    isAnimatingFollowUpdate,
  }
}

// Sets up map events to get a callback when the user interacts with the map
// which should override the follower on state
function useStopFollowingOnInteraction(
  isAnimatingFollowUpdate: React.MutableRefObject<boolean>,
  setShouldFollow: React.Dispatch<React.SetStateAction<boolean>>
) {
  useMapEvents({
    // If the user drags or zooms, they want manual control of the map.
    // `zoomstart` is fired when the map changes zoom levels
    // this can be because of animating the zoom change or user input
    zoomstart: () => {
      // But don't disable `shouldFollow` if the zoom was triggered by Follower.
      if (!isAnimatingFollowUpdate.current) {
        setShouldFollow(false)
      }
    },

    // `dragstart` is fired when a user drags the map
    // it is expected that this event is not fired for anything but user input
    // by [handler/Map.Drag.js](https://github.com/Leaflet/Leaflet/blob/6b90c169d6cd11437bfbcc8ba261255e009afee3/src/map/handler/Map.Drag.js#L113-L115)
    dragstart: () => {
      setShouldFollow(false)
    },

    // `moveend` is called when the leaflet map has finished animating a pan
    moveend: () => {
      // Wait until the `Follower` `setView` animation is finished to resume listening for user interaction.
      if (isAnimatingFollowUpdate.current) {
        isAnimatingFollowUpdate.current = false
      }
    },

    // `autopanstart` is invoked when opening a popup causes the map to pan to fit it
    autopanstart: () => setShouldFollow(false),
  })
}

export type InterruptibleFollowerProps = InteractiveFollowState & FollowerProps

// Component which provides following capability and configures the map to stop
// the follower component when a user interacts with the map
export const InterruptibleFollower = ({
  shouldFollow,
  setShouldFollow,
  isAnimatingFollowUpdate,
  positions,
  onUpdate,
}: InterruptibleFollowerProps) => {
  useStopFollowingOnInteraction(isAnimatingFollowUpdate, setShouldFollow)

  return (
    <>
      <Follower
        isAnimatingFollowUpdate={isAnimatingFollowUpdate}
        shouldFollow={shouldFollow}
        setShouldFollow={setShouldFollow}
        positions={positions}
        onUpdate={onUpdate}
      />
      <RecenterControl
        position="topright"
        recenter={() => setShouldFollow(true)}
      />
    </>
  )
}

export const StatefulInteractiveFollower = (props: FollowerProps) => {
  return InterruptibleFollower({
    ...props,
    ...useInteractiveFollowerState(),
  })
}

// #region Previous Follower Logic
export const autoCenter = (
  map: LeafletMap,
  latLngs: LatLngExpression[],
  pickerContainerIsVisible: boolean
): void => {
  if (latLngs.length === 0) {
    map.setView(defaultCenter, 13)
  } else if (latLngs.length === 1) {
    map.setView(latLngs[0], 16)
  } else if (latLngs.length > 1) {
    map.fitBounds(Leaflet.latLngBounds(latLngs), {
      paddingBottomRight: [20, 50],
      paddingTopLeft: [pickerContainerIsVisible ? 220 : 20, 20],
    })
  }
}

export const drawerOffsetAutoCenter: UpdateMapFromPointsFn = (map, points) => {
  if (points.length === 0) {
    // If there are no points, blink to default center
    map.setView(defaultCenter, 13, { animate: false })
    return
  }

  const { width, height } = map.getContainer().getBoundingClientRect()
  const mapContainerBounds = new Bounds([0, 0], [width, height])

  // ```
  // vpcElement.getBoundingClientRect().right - mapElement.getBoundingClientRect().left
  //  -> 445
  // ```
  // Create a new inner bounds from the map bounds + "padding" to shrink the
  // inner bounds
  // In this case, we get the top left of the inner bounds by padding the left
  // with the distance from the right side of the VPC to the left side of the
  // map container
  const topLeft = new Point(445, 0)

  if (points.length === 1) {
    const targetZoom = 16
    const innerBounds = new Bounds(topLeft, mapContainerBounds.getBottomRight())
    // The "new center" is the offset between the two bounding boxes centers
    const offset = innerBounds
      .getCenter()
      .subtract(mapContainerBounds.getCenter())

    const targetPoint = map
        // Project the target point into screenspace for the target zoom
        .project(points[0], targetZoom)
        // Offset the target point in screenspace to move the center of the map
        // to apply the padding to the center
        .subtract(offset),
      // convert the target point to worldspace from screenspace
      targetLatLng = map.unproject(targetPoint, targetZoom)

    // Zoom/Pan center of map to offset location in worldspace
    map.setView(targetLatLng, targetZoom)
  } else {
    const pointsBounds = Leaflet.latLngBounds(points)
    map.fitBounds(pointsBounds, {
      paddingBottomRight: [50, 20],
      paddingTopLeft: topLeft,
    })
  }
}

export const usePickerContainerFollowerFn = () => {
  const [{ pickerContainerIsVisible }] = useContext(StateDispatchContext)

  const onUpdate = useCallback(
    (map: Leaflet.Map, points: Leaflet.LatLng[]): void =>
      autoCenter(map, points, pickerContainerIsVisible),
    [pickerContainerIsVisible]
  )

  return onUpdate
}
// #endregion
// #endregion

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const mapRef: MutableRefObject<LeafletMap | null> =
    // this prop is only for tests, and is consistent between renders, so the hook call is consistent
    // eslint-disable-next-line react-hooks/rules-of-hooks
    props.reactLeafletRef || useRef(null)
  const defaultZoom = 13
  const [streetViewEnabled, setStreetViewEnabled] = useState<boolean>(
    props.streetViewInitiallyEnabled || false
  )

  const mapLimits = getMapLimits()
  const { allowFullscreen = true } = props

  const stateClasses = joinClasses([
    "c-vehicle-map-state",
    streetViewEnabled ? "c-vehicle-map-state--street-view-enabled" : null,
    props.stateClasses,
  ])

  const stops = (props.shapes || []).flatMap((shape) => shape.stops || [])
  const tileType = props.tileType || "base"

  return (
    <>
      <div className={stateClasses} />
      <MapContainer
        className="c-vehicle-map"
        id="id-vehicle-map"
        maxBounds={
          mapLimits
            ? [
                [mapLimits.south, mapLimits.west],
                [mapLimits.north, mapLimits.east],
              ]
            : undefined
        }
        zoomControl={false}
        center={defaultCenter}
        zoom={defaultZoom}
        ref={mapRef}
        attributionControl={false}
      >
        <TileLayer
          url={`${tilesetUrlForType(tileType)}`}
          attribution={
            tileType === "base"
              ? '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              : '<a href="https://www.mass.gov/info-details/massgis-data-2021-aerial-imagery">MassGIS 2021</a>'
          }
        />
        <EventAdder />
        {props.allowStreetView && (
          <StreetViewControl
            position="topright"
            streetViewEnabled={streetViewEnabled}
            setStreetViewEnabled={setStreetViewEnabled}
          />
        )}

        <ZoomControl position="topright" />

        {allowFullscreen && <FullscreenControl position="topright" />}
        <AttributionControl position="bottomright" prefix={false} />
        <TileTypeContext.Provider value={tileType}>
          <Pane
            name="primaryVehicles"
            pane="markerPane"
            style={{ zIndex: 499 }}
          >
            {props.vehicles.map((vehicle: Vehicle) => (
              <VehicleMarker
                key={vehicle.id}
                vehicle={vehicle}
                isPrimary={true}
                isSelected={props.selectedVehicleId === vehicle.id}
                onSelect={props.onPrimaryVehicleSelect}
              />
            ))}
          </Pane>

          <Pane
            name="secondaryVehicles"
            pane="markerPane"
            style={{ zIndex: 400 }}
          >
            {(props.secondaryVehicles || []).map((vehicle) => (
              <VehicleMarker
                key={vehicle.id}
                vehicle={vehicle}
                isPrimary={false}
              />
            ))}
          </Pane>

          {(props.trainVehicles || []).map((trainVehicle: TrainVehicle) => (
            <TrainVehicleMarker
              key={trainVehicle.id}
              trainVehicle={trainVehicle}
            />
          ))}
          {(props.shapes || []).map((shape) => (
            <RouteShape key={shape.id} shape={shape} />
          ))}

          <ZoomLevelWrapper>
            {(zoomLevel) => (
              <>
                {stops.length > 0 && (
                  <Pane
                    name="routeStopMarkers"
                    pane="markerPane"
                    style={{ zIndex: 450 }} // should be above other non-interactive elements
                  >
                    <RouteStopMarkers
                      stops={stops}
                      zoomLevel={zoomLevel}
                      includeStopCard={
                        props.includeStopCard && inTestGroup(TestGroups.MapBeta)
                      }
                    />
                  </Pane>
                )}

                <Pane
                  name="notableLocationMarkers"
                  pane="markerPane"
                  style={{ zIndex: 410 }}
                >
                  {zoomLevel >= 15 &&
                    props.stations?.map((station) => (
                      <StationMarker
                        key={station.id}
                        station={station}
                        zoomLevel={zoomLevel}
                      />
                    ))}
                  {zoomLevel >= 15 && <GarageMarkers zoomLevel={zoomLevel} />}
                </Pane>
              </>
            )}
          </ZoomLevelWrapper>
          <StreetViewModeEnabledContext.Provider value={streetViewEnabled}>
            {props.children}
          </StreetViewModeEnabledContext.Provider>
        </TileTypeContext.Provider>
      </MapContainer>
    </>
  )
}

export const vehicleToLeafletLatLng = ({
  latitude,
  longitude,
}: Vehicle): Leaflet.LatLng => Leaflet.latLng(latitude, longitude)

// TODO: replacing with react controlled component which self-contains
// state and does not rely on setting a class on the map container
export const FollowerStatusClasses = (
  shouldFollow: boolean
): string | undefined => {
  return shouldFollow ? "c-vehicle-map-state--auto-centering" : undefined
}

export const MapFollowingPrimaryVehicles = (props: Props) => {
  const state = useInteractiveFollowerState(),
    { shouldFollow } = state

  const positions: LatLng[] = props.vehicles.map(vehicleToLeafletLatLng)

  return (
    <Map {...props} stateClasses={FollowerStatusClasses(shouldFollow)}>
      <>
        <InterruptibleFollower
          positions={positions}
          {...state}
          onUpdate={usePickerContainerFollowerFn()}
        />
        {props.children}
      </>
    </Map>
  )
}

export const MapFollowingSelectionKey = (
  props: Props & { selectionKey?: string }
) => {
  const state = useInteractiveFollowerState(),
    { shouldFollow, setShouldFollow } = state

  const positions: LatLng[] = props.vehicles.map(vehicleToLeafletLatLng)

  useEffect(() => setShouldFollow(true), [props.selectionKey, setShouldFollow])

  return (
    <Map {...props} stateClasses={FollowerStatusClasses(shouldFollow)}>
      <>
        <InterruptibleFollower
          positions={positions}
          {...state}
          onUpdate={usePickerContainerFollowerFn()}
        />
        {props.children}
      </>
    </Map>
  )
}

export default Map
