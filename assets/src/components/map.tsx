import Leaflet, { Map as LeafletMap, Marker } from "leaflet"
import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import React, {
  MutableRefObject,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabelString from "../helpers/vehicleLabel"
import { drawnStatus, statusClass } from "../models/vehicleStatus"
import { Vehicle, VehicleId } from "../realtime.d"
import { Shape, Stop } from "../schedule"
import { Settings } from "../settings"
import { Dispatch, selectVehicle as selectVehicleAction, State } from "../state"

interface Props {
  vehicles: Vehicle[]
  centerOnVehicle?: string
  initialZoom?: number
  shapes?: Shape[]
}

interface VehicleMarkers {
  icon: Marker
  label: Marker
}

interface MarkerDict {
  [id: string]: VehicleMarkers
}

interface RouteShapeWithStops {
  routeLine: Leaflet.Polyline
  stopCicles?: Leaflet.CircleMarker[]
}

export interface PolylinesByShapeId {
  [shapeId: string]: RouteShapeWithStops
}

interface MapState {
  map: LeafletMap | null
  markers: MarkerDict
  shapes: PolylinesByShapeId
  zoom: Leaflet.Control | null
}

const selectVehicle = ({ id }: Vehicle, dispatch: Dispatch) => () =>
  dispatch(selectVehicleAction(id))

const makeVehicleIcon = (vehicle: Vehicle): Leaflet.DivIcon => {
  const centerX = 12
  const centerY = 12
  return Leaflet.divIcon({
    html: `<svg
        height="24"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          class="${statusClass(drawnStatus(vehicle))}"
          d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
          transform="rotate(${vehicle.bearing}, ${centerX}, ${centerY})"
        />
      </svg>`,
    iconAnchor: [centerX, centerY],
    className: "m-vehicle-map__icon",
  })
}

const makeLabelIcon = (
  vehicle: Vehicle,
  settings: Settings,
  selectedVehicleId?: VehicleId
): Leaflet.DivIcon => {
  const labelString = vehicleLabelString(vehicle, settings)
  const selectedClass = vehicle.id === selectedVehicleId ? "selected" : ""
  return Leaflet.divIcon({
    className: `m-vehicle-map__label ${selectedClass}`,
    html: `<svg viewBox="0 0 42 16" width="42" height="16">
            <rect
                class="m-vehicle-icon__label-background"
                width="100%" height="100%"
                rx="5.5px" ry="5.5px"
              />
            <text class="m-vehicle-icon__label" x="50%" y="50%" text-anchor="middle" dominant-baseline="central">
              ${labelString}
            </text>
          </svg>`,
    iconAnchor: [21, -16],
  })
}

export const updateMarkers = (
  newVehicles: { [id: string]: Vehicle },
  oldMarkerDict: MarkerDict,
  map: LeafletMap,
  appState: State,
  dispatch: Dispatch
): MarkerDict => {
  const markersToKeep: MarkerDict = Object.entries(oldMarkerDict).reduce(
    (acc: MarkerDict, [vehicleId, oldMarkers]) => {
      if (newVehicles[vehicleId] === undefined) {
        // Vehicle doesn't exist. Remove stale markers from the map.
        oldMarkers.icon.remove()
        oldMarkers.label.remove()
        return acc
      } else {
        // Keep the markers. We'll update them later.
        return { ...acc, [vehicleId]: oldMarkers }
      }
    },
    {} as MarkerDict
  )

  return Object.entries(newVehicles).reduce(
    (existingMarkers, [vehicleId, vehicle]) => {
      const vehicleIcon: Leaflet.DivIcon = makeVehicleIcon(vehicle)
      const labelIcon: Leaflet.DivIcon = makeLabelIcon(
        vehicle,
        appState.settings,
        appState.selectedVehicleId
      )
      if (existingMarkers[vehicleId] === undefined) {
        // A new vehicle. Make new markers for it.
        const markers = {
          icon: Leaflet.marker([vehicle.latitude, vehicle.longitude], {
            icon: vehicleIcon,
          })
            .on("click", selectVehicle(vehicle, dispatch))
            .addTo(map),
          label: Leaflet.marker([vehicle.latitude, vehicle.longitude], {
            icon: labelIcon,
          })
            .on("click", selectVehicle(vehicle, dispatch))
            .addTo(map),
        }
        return { ...existingMarkers, [vehicleId]: markers }
      } else {
        // Markers already exist for this vehicle. Update them.
        const markers = existingMarkers[vehicleId]
        markers.icon.setLatLng([vehicle.latitude, vehicle.longitude])
        markers.label.setLatLng([vehicle.latitude, vehicle.longitude])

        markers.icon.setIcon(vehicleIcon)
        markers.label.setIcon(labelIcon)
        return existingMarkers
      }
    },
    markersToKeep
  )
}

const removeDeselectedRouteShapes = (
  previousShapes: PolylinesByShapeId,
  shapes: Shape[]
) => {
  const shapeIds = shapes.map(shape => shape.id)

  Object.entries(previousShapes).forEach(([shapeId, routeShapeWithStops]) => {
    if (!shapeIds.includes(shapeId)) {
      routeShapeWithStops.routeLine.remove()

      if (routeShapeWithStops.stopCicles) {
        routeShapeWithStops.stopCicles.forEach(stopCircle =>
          stopCircle.remove()
        )
      }
    }
  })
}

type LatLon = [number, number]
export const latLons = ({ points }: Shape): LatLon[] =>
  points.map(point => [point.lat, point.lon] as LatLon)

export const strokeOptions = ({ color }: Shape): object =>
  color
    ? {
        color,
        opacity: 1.0,
        weight: 3,
      }
    : {
        color: "#4db6ac",
        opacity: 0.6,
        weight: 6,
      }

const toPolyline = (shape: Shape): Leaflet.Polyline =>
  Leaflet.polyline(latLons(shape), {
    className: "m-vehicle-map__route-shape",
    ...strokeOptions(shape),
  })

const drawStop = ({ lat, lon }: Stop, map: LeafletMap): Leaflet.CircleMarker =>
  Leaflet.circleMarker([lat, lon], {
    radius: 3,
    className: "m-vehicle-map__stop",
  }).addTo(map)

const drawShape = (shape: Shape, map: LeafletMap): RouteShapeWithStops => {
  const routeLine = toPolyline(shape).addTo(map)
  let stopCicles

  if (shape.stops) {
    stopCicles = shape.stops.map(stop => drawStop(stop, map))
  }

  return {
    routeLine,
    stopCicles,
  }
}

export const updateShapes = (
  shapes: Shape[],
  previousShapes: PolylinesByShapeId,
  map: LeafletMap
): PolylinesByShapeId => {
  removeDeselectedRouteShapes(previousShapes, shapes)

  return shapes.reduce(
    (acc, shape) => ({
      ...acc,
      [shape.id]: previousShapes[shape.id] || drawShape(shape, map),
    }),
    {} as PolylinesByShapeId
  )
}

export const defaultCenter: [number, number] = [42.360718, -71.05891]

export const recenterMap = (
  map: LeafletMap,
  centerOnVehicle: VehicleId | undefined,
  vehiclesById: { [id: string]: Vehicle }
): void => {
  if (centerOnVehicle !== undefined) {
    const vehicle: Vehicle | undefined = vehiclesById[centerOnVehicle]
    if (vehicle !== undefined) {
      map.setView([vehicle.latitude, vehicle.longitude], map.getZoom())
    }
  }
}

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const [appState, dispatch] = useContext(StateDispatchContext)
  const containerRef: MutableRefObject<HTMLDivElement | null> = useRef(null)
  const [mapState, setMapState] = useState<MapState>({
    map: null,
    markers: {},
    shapes: {},
    zoom: null,
  })
  const [autoCenter, setAutoCenter] = useState<boolean>(true)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const map =
      mapState.map ||
      Leaflet.map(containerRef.current, {
        center: props.centerOnVehicle ? undefined : defaultCenter,
        layers: [
          Leaflet.tileLayer(
            `https://mbta-map-tiles-dev.s3.amazonaws.com/osm_tiles/{z}/{x}/{y}.png`,
            {
              attribution:
                '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            }
          ),
        ],
        zoom: props.initialZoom || 16,
        zoomControl: false,
      }).on("dragstart", () => {
        // If the user drags, they want manual control of the map.
        setAutoCenter(false)
      })

    const zoom =
      mapState.zoom || Leaflet.control.zoom({ position: "topright" }).addTo(map)

    const newVehicles = props.vehicles.reduce(
      (acc, vehicle) => ({ ...acc, [vehicle.id]: vehicle }),
      {} as { [id: string]: Vehicle }
    )

    const markers = updateMarkers(
      newVehicles,
      mapState.markers,
      map,
      appState,
      dispatch
    )

    const shapes =
      props.shapes !== undefined
        ? updateShapes(props.shapes, mapState.shapes, map)
        : {}

    if (autoCenter) {
      recenterMap(map, props.centerOnVehicle, newVehicles)
    }

    setMapState({ map, markers, shapes, zoom })
  }, [props, containerRef])

  return (
    <div
      id="id-vehicle-map"
      className="m-vehicle-map"
      ref={container => (containerRef.current = container)}
    />
  )
}

export default Map
