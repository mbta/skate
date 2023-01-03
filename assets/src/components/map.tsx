import Leaflet, {
  Control,
  ControlOptions,
  DomUtil,
  LatLng,
  LatLngExpression,
  Map as LeafletMap,
} from "leaflet"

import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import "leaflet.fullscreen"
import React, {
  MutableRefObject,
  ReactElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import ReactDOM from "react-dom"

import {
  AttributionControl,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet"
import { createControlComponent } from "@react-leaflet/core"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import { TrainVehicle, Vehicle } from "../realtime.d"
import { Shape, Stop } from "../schedule"
import { equalByElements } from "../helpers/array"
import { streetViewUrl } from "../util/streetViewUrl"
import appData from "../appData"
import inTestGroup, { MAP_BETA_GROUP_NAME } from "../userInTestGroup"
import {
  GarageMarkers,
  RouteShape,
  RouteStopMarkers,
  StationIconSize,
  StationMarker,
  TrainVehicleMarker,
  VehicleMarker,
} from "./mapMarkers"
import { WalkingIcon } from "../helpers/icon"

export interface Props {
  vehicles: Vehicle[]
  shapes?: Shape[]
  // secondaryVehicles are smaller, deemphasized, and don't affect autocentering
  secondaryVehicles?: Vehicle[]
  // trainVehicles are white, don't get a label, and don't affect autocentering
  trainVehicles?: TrainVehicle[]
  reactLeafletRef?: MutableRefObject<LeafletMap | null>
  onPrimaryVehicleSelect?: (vehicle: Vehicle) => void
  allowStreetView?: boolean
  children?: JSX.Element | JSX.Element[]
  stopCardDirection?: DirectionId
  includeStopCard?: boolean
  stations?: Stop[] | null
}

export const defaultCenter: LatLngExpression = {
  lat: 42.360718,
  lng: -71.05891,
}

interface RecenterControlProps extends ControlOptions {
  recenter: () => void
}

interface StreetViewControlProps extends ControlOptions {
  streetViewEnabled: boolean
  setStreetViewEnabled: React.Dispatch<React.SetStateAction<boolean>>
}

export const StreetViewControl = ({
  streetViewEnabled: streetViewEnabled,
  setStreetViewEnabled: setStreetViewEnabled,
}: StreetViewControlProps): JSX.Element | null => {
  const map = useMap()
  const portalParent = map
    .getContainer()
    .querySelector(".leaflet-control-container")
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)
  const id = "street-view-toggle-" + useId()

  useEffect(() => {
    if (!portalParent || !portalElement) {
      setPortalElement(document.createElement("div"))
    }

    if (portalParent && portalElement) {
      portalElement.className =
        "leaflet-control leaflet-bar m-vehicle-map__street-view-control"
      portalParent.append(portalElement)
      Leaflet.DomEvent.disableClickPropagation(portalElement)
    }

    return () => portalElement?.remove()
  }, [portalElement, portalParent, setStreetViewEnabled])

  const control = (
    <>
      <label htmlFor={id}>
        <WalkingIcon />
        Street View
      </label>
      <div className="form-check form-switch">
        <input
          id={id}
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={streetViewEnabled}
          onChange={() => setStreetViewEnabled((enabled) => !enabled)}
        />
      </div>
    </>
  )

  return portalElement ? ReactDOM.createPortal(control, portalElement) : null
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
      "leaflet-control leaflet-bar m-vehicle-map__recenter-button"
    )
    controlContainer.onclick = (e) => {
      e.stopPropagation()
      e.preventDefault()
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

const tilesetUrl = (): string => appData()?.tilesetUrl || ""

const EventAdder = ({
  isAutoCentering,
  setShouldAutoCenter,
  setZoomLevel,
  streetViewMode,
  setStreetViewMode,
}: {
  isAutoCentering: MutableRefObject<boolean>
  setShouldAutoCenter: (arg0: boolean) => void
  setZoomLevel: (level: number) => void
  streetViewMode: boolean
  setStreetViewMode: React.Dispatch<React.SetStateAction<boolean>>
}): ReactElement => {
  const map = useMap()
  useMapEvents({
    // If the user drags or zooms, they want manual control of the map.

    // `zoomstart` is fired when the map changes zoom levels
    // this can be because of animating the zoom change or user input
    zoomstart: () => {
      // But don't disable `shouldAutoCenter` if the zoom was triggered by AutoCenterer.
      if (!isAutoCentering.current) {
        setShouldAutoCenter(false)
      }
    },

    zoomend: () => {
      setZoomLevel(map.getZoom())
    },

    // `dragstart` is fired when a user drags the map
    // it is expected that this event is not fired for anything but user input
    // by [handler/Map.Drag.js](https://github.com/Leaflet/Leaflet/blob/6b90c169d6cd11437bfbcc8ba261255e009afee3/src/map/handler/Map.Drag.js#L113-L115)
    dragstart: () => {
      setShouldAutoCenter(false)
    },

    // `moveend` is called when the leaflet map has finished animating a pan
    moveend: () => {
      // Wait until the auto centering animation is finished to resume listening for user interaction.
      if (isAutoCentering.current) {
        isAutoCentering.current = false
      }
    },

    // `autopanstart` is invoked when opening a popup causes the map to pan to fit it
    autopanstart: () => setShouldAutoCenter(false),

    popupopen: (e) => setTimeout(() => (e.popup.options.autoPan = false), 100),

    popupclose: (e) => (e.popup.options.autoPan = true),

    ...(streetViewMode
      ? {
          click: (e) => {
            window.open(
              streetViewUrl({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
              }),
              "_blank"
            )
            setStreetViewMode(false)
          },

          keydown: (e) => {
            if (e.originalEvent.key === "Escape") {
              setStreetViewMode(false)
            }
          },
        }
      : {}),
  })
  return <></>
}

const Autocenterer = ({
  latLngs,
  shouldAutoCenter,
  isAutoCentering,
}: {
  shouldAutoCenter: boolean
  isAutoCentering: MutableRefObject<boolean>
  latLngs: LatLng[]
}) => {
  const map = useMap()

  const [{ pickerContainerIsVisible }] = useContext(StateDispatchContext)
  const [currentLatLngs, setCurrentLatLngs] = useState<LatLng[]>(latLngs)

  if (
    !equalByElements(latLngs, currentLatLngs, (latLng1, latLng2) =>
      latLng1.equals(latLng2)
    )
  ) {
    setCurrentLatLngs(latLngs)
  }

  useEffect(() => {
    if (map !== null && shouldAutoCenter) {
      isAutoCentering.current = true
      autoCenter(map, currentLatLngs, pickerContainerIsVisible)
    }
  }, [
    map,
    shouldAutoCenter,
    isAutoCentering,
    currentLatLngs,
    pickerContainerIsVisible,
  ])

  return <></>
}

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const mapRef: MutableRefObject<LeafletMap | null> =
    // this prop is only for tests, and is consistent between renders, so the hook call is consistent
    // eslint-disable-next-line react-hooks/rules-of-hooks
    props.reactLeafletRef || useRef(null)
  const [shouldAutoCenter, setShouldAutoCenter] = useState<boolean>(true)
  const defaultZoom = 13
  const [zoomLevel, setZoomLevel] = useState<number>(defaultZoom)
  const isAutoCentering: MutableRefObject<boolean> = useRef(false)
  const [streetViewEnabled, setStreetViewEnabled] = useState<boolean>(false)

  const latLngs: LatLng[] = props.vehicles.map(({ latitude, longitude }) =>
    Leaflet.latLng(latitude, longitude)
  )

  const stateClasses = className([
    "m-vehicle-map-state",
    shouldAutoCenter ? "m-vehicle-map-state--auto-centering" : null,
    streetViewEnabled ? "m-vehicle-map-state--street-view-enabled" : null,
  ])

  const stationIconSize =
    zoomLevel <= 16 ? StationIconSize.small : StationIconSize.large

  return (
    <>
      <div className={stateClasses} />
      <MapContainer
        className="m-vehicle-map"
        id="id-vehicle-map"
        maxBounds={[
          [41.2, -72],
          [43, -69.8],
        ]}
        zoomControl={false}
        center={defaultCenter}
        zoom={defaultZoom}
        ref={mapRef}
        attributionControl={false}
      >
        <EventAdder
          isAutoCentering={isAutoCentering}
          setShouldAutoCenter={setShouldAutoCenter}
          setZoomLevel={setZoomLevel}
          streetViewMode={streetViewEnabled}
          setStreetViewMode={setStreetViewEnabled}
        />
        <Autocenterer
          shouldAutoCenter={shouldAutoCenter}
          isAutoCentering={isAutoCentering}
          latLngs={latLngs}
        />
        {props.allowStreetView && (
          <StreetViewControl
            position="topright"
            streetViewEnabled={streetViewEnabled}
            setStreetViewEnabled={setStreetViewEnabled}
          />
        )}
        <ZoomControl position="topright" />
        <FullscreenControl position="topright" />
        <RecenterControl
          position="topright"
          recenter={() => setShouldAutoCenter(true)}
        />
        <AttributionControl position="bottomright" prefix={false} />

        <TileLayer
          url={`${tilesetUrl()}/{z}/{x}/{y}.png`}
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {props.vehicles.map((vehicle: Vehicle) => (
          <VehicleMarker
            key={vehicle.id}
            vehicle={vehicle}
            isPrimary={true}
            onSelect={props.onPrimaryVehicleSelect}
          />
        ))}
        {(props.secondaryVehicles || []).map((vehicle: Vehicle) => (
          <VehicleMarker key={vehicle.id} vehicle={vehicle} isPrimary={false} />
        ))}
        {(props.trainVehicles || []).map((trainVehicle: TrainVehicle) => (
          <TrainVehicleMarker
            key={trainVehicle.id}
            trainVehicle={trainVehicle}
          />
        ))}

        {(props.shapes || []).map((shape) => (
          <RouteShape key={shape.id} shape={shape} />
        ))}
        <RouteStopMarkers
          stops={(props.shapes || []).flatMap((shape) => shape.stops || [])}
          iconSize={stationIconSize}
        />
        {zoomLevel >= 15 &&
          props.stations?.map((station) => (
            <StationMarker
              key={station.id}
              station={station}
              iconSize={stationIconSize}
            />
          ))}
        {inTestGroup(MAP_BETA_GROUP_NAME) && zoomLevel >= 15 && (
          <GarageMarkers zoomLevel={zoomLevel} />
        )}
        {props.children}
      </MapContainer>
    </>
  )
}

export default Map
