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
import { Dispatch, selectVehicle as selectVehicleAction } from "../state"

interface Props {
  vehicles: Vehicle[]
  centerOnVehicle: string | null
  initialZoom?: number
  shapes?: Shape[]
}

interface VehicleMarkers {
  icon: Marker
  label: Marker
}

interface MarkerDict {
  [id: string]: VehicleMarkers | undefined
}

interface RouteShapeWithStops {
  routeLine: Leaflet.Polyline
  stopCicles?: Leaflet.CircleMarker[]
}

export interface PolylinesByShapeId {
  [shapeId: string]: RouteShapeWithStops
}

interface State {
  map: LeafletMap | null
  markers: MarkerDict
  shapes: PolylinesByShapeId
  zoom: Leaflet.Control | null
}

const ICON_ANCHOR: [number, number] = [12, 12]

const vehicleIconProps = (vehicle: Vehicle): Leaflet.DivIconOptions => ({
  html: `<svg
        height="24"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          class="${statusClass(drawnStatus(vehicle))}"
          d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
          transform-origin="${ICON_ANCHOR[0]}px ${ICON_ANCHOR[1]}px"
          transform="rotate(${vehicle.bearing})"
        />
      </svg>`,
  iconAnchor: ICON_ANCHOR,
  className: "m-vehicle-map__icon",
})

const selectVehicle = ({ id }: Vehicle, dispatch: Dispatch) => () =>
  dispatch(selectVehicleAction(id))

const updateVehicle = (
  vehicle: Vehicle,
  { map, markers }: State,
  settings: Settings,
  centerOnVehicle: string | null,
  selectedVehicleId?: VehicleId
): void => {
  const markersForVehicle = markers[vehicle.id]
  if (!markersForVehicle) {
    return
  }

  const { icon: vehicleIcon, label: vehicleLabel } = markersForVehicle

  const { id: vehicleId, latitude, longitude } = vehicle
  const zoom = map!.getZoom()

  const labelString = vehicleLabelString(vehicle, settings)

  const icon = Leaflet.divIcon(vehicleIconProps(vehicle))

  const selectedClass = vehicleId === selectedVehicleId ? "selected" : ""
  const label = Leaflet.divIcon({
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
    iconAnchor: [12, -24],
  })

  if (centerOnVehicle === vehicle.id) {
    map!.setView([latitude, longitude], zoom)
  }

  vehicleIcon.setLatLng([latitude, longitude])
  vehicleLabel.setLatLng([latitude, longitude])

  vehicleIcon.setIcon(icon)
  vehicleLabel.setIcon(label)
}

export const updateVehicles = (
  { vehicles, centerOnVehicle }: Props,
  state: State,
  settings: Settings,
  selectedVehicleId?: VehicleId
): void => {
  vehicles.forEach(v =>
    updateVehicle(v, state, settings, centerOnVehicle, selectedVehicleId)
  )
}

export const updateMarkers = (
  newVehicles: { [id: string]: Vehicle },
  oldDict: MarkerDict,
  map: LeafletMap,
  dispatch: Dispatch
): MarkerDict => {
  const newDict = Object.entries(oldDict).reduce(
    (acc: MarkerDict, [vehicleId, existingMarkers]) => {
      // remove stale markers from the map
      const newValue = newVehicles[vehicleId] ? existingMarkers : undefined
      if (!newValue && existingMarkers) {
        existingMarkers.icon.remove()
        existingMarkers.label.remove()
      }
      return { ...acc, [vehicleId]: newValue }
    },
    {} as MarkerDict
  )

  return Object.entries(newVehicles).reduce((acc, [id, vehicle]) => {
    if (acc[id] === undefined) {
      acc[id] = {
        icon: Leaflet.marker([vehicle.latitude, vehicle.longitude], {
          icon: Leaflet.divIcon(vehicleIconProps(vehicle)),
        })
          .on("click", selectVehicle(vehicle, dispatch))
          .addTo(map),
        label: Leaflet.marker([vehicle.latitude, vehicle.longitude], {
          icon: Leaflet.divIcon(vehicleIconProps(vehicle)),
        })
          .on("click", selectVehicle(vehicle, dispatch))
          .addTo(map),
      }
    }
    return acc
  }, newDict)
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

export const defaultCenter = ({
  centerOnVehicle,
}: Props): [number, number] | undefined =>
  centerOnVehicle ? undefined : [42.360718, -71.05891]

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const [{ selectedVehicleId, settings }, dispatch] = useContext(
    StateDispatchContext
  )
  const containerRef: MutableRefObject<HTMLDivElement | null> = useRef(null)
  const [state, updateState] = useState<State>({
    map: null,
    markers: {},
    shapes: {},
    zoom: null,
  })

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const map =
      state.map ||
      Leaflet.map(containerRef.current, {
        center: defaultCenter(props),
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
      })

    const zoom =
      state.zoom || Leaflet.control.zoom({ position: "topright" }).addTo(map)

    const newVehicles = props.vehicles.reduce(
      (acc, vehicle) => ({ ...acc, [vehicle.id]: vehicle }),
      {} as { [id: string]: Vehicle }
    )

    const markers = updateMarkers(newVehicles, state.markers, map, dispatch)

    updateVehicles(
      props,
      { map, markers, shapes: {}, zoom },
      settings,
      selectedVehicleId
    )

    const shapes =
      props.shapes !== undefined
        ? updateShapes(props.shapes, state.shapes, map)
        : {}

    updateState({ map, markers, shapes, zoom })
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
