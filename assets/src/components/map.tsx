import Leaflet, { LatLng, LatLngLiteral, Map as LeafletMap } from "leaflet"

import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import "leaflet.fullscreen"
import React, {
  MutableRefObject,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  AttributionControl,
  MapContainer,
  Pane,
  TileLayer,
  useMapEvents,
  ZoomControl,
} from "react-leaflet"
import { createControlComponent } from "@react-leaflet/core"

import { joinClasses } from "../helpers/dom"
import { TrainVehicle, Vehicle, VehicleId } from "../realtime"
import { Shape, Stop } from "../schedule"
import {
  GarageMarkers,
  RouteShape,
  RouteStopMarkers,
  StationMarker,
  TrainVehicleMarker,
} from "./mapMarkers"
import { VehicleMarker } from "./map/markers/vehicleMarker"
import ZoomLevelWrapper from "./ZoomLevelWrapper"
import { StreetViewControl } from "./map/controls/StreetViewSwitch"
import StreetViewModeEnabledContext from "../contexts/streetViewModeEnabledContext"
import { TileType, tilesetUrlForType } from "../tilesetUrls"
import { TileTypeContext } from "../contexts/tileTypeContext"
import getMapLimits from "../mapLimits"
import {
  useInteractiveFollowerState,
  RecenterControlWithInterruptibleFollower,
  usePickerContainerFollowerFn,
} from "./map/follower"

export interface Props extends PropsWithChildren {
  reactLeafletRef?: MutableRefObject<LeafletMap | null>
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

  zoom?: number
  center?: LatLngLiteral
}

export const defaultCenter: LatLngLiteral = {
  lat: 42.360718,
  lng: -71.05891,
}

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
        center={props.center ?? defaultCenter}
        zoom={props.zoom ?? defaultZoom}
        ref={mapRef}
        attributionControl={false}
      >
        <TileLayer
          maxZoom={21}
          maxNativeZoom={20}
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
                      includeStopCard={props.includeStopCard}
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

export const MapFollowingPrimaryVehicles = (props: Props) => {
  const state = useInteractiveFollowerState()

  const positions: LatLng[] = props.vehicles.map(vehicleToLeafletLatLng)

  return (
    <Map {...props}>
      <>
        <RecenterControlWithInterruptibleFollower
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
    { setShouldFollow } = state

  const positions: LatLng[] = props.vehicles.map(vehicleToLeafletLatLng)

  useEffect(() => setShouldFollow(true), [props.selectionKey, setShouldFollow])

  return (
    <Map {...props}>
      <>
        <RecenterControlWithInterruptibleFollower
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
