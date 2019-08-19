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
import vehicleAdherenceDisplayClass from "../helpers/vehicleAdherenceDisplayClass"
import vehicleLabelString from "../helpers/vehicleLabel"
import { status } from "../models/vehicleStatus"
import { Vehicle } from "../realtime.d"
import { VehicleLabelSetting } from "../settings"

interface Props {
  vehicles: Vehicle[]
  centerOnVehicle: string | null
}

interface VehicleMarkers {
  icon: Marker
  label: Marker
}

interface MarkerDict {
  [id: string]: VehicleMarkers | null
}

interface State {
  map: LeafletMap | null
  markers: MarkerDict
}

const iconAnchor: [number, number] = [12, 12]

const updateVehicle = (
  vehicle: Vehicle,
  { map, markers }: State,
  labelSetting: VehicleLabelSetting,
  centerOnVehicle: string | null
): void => {
  const { icon: vehicleIcon, label: vehicleLabel } = markers[vehicle.id]!

  const { bearing, headwaySpacing, latitude, longitude } = vehicle
  const zoom = map!.getZoom()

  const labelString = vehicleLabelString(vehicle, labelSetting)

  const icon = Leaflet.divIcon({
    className: `m-vehicle-map__icon ${vehicleAdherenceDisplayClass(
      headwaySpacing,
      status(vehicle)
    )}`,
    html: `<svg
        height="24"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          class="m-vehicle-properties-panel__schedule-adherence-status-icon"
          d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
          transform-origin="${iconAnchor[0]}px ${iconAnchor[1]}px"
          transform="rotate(${bearing})"
        />
      </svg>`,
    iconAnchor,
  })

  const label = Leaflet.divIcon({
    className: "m-vehicle-map__label",
    html: `<svg>
            <text class="m-vehicle-icon__label">${labelString}</text>
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

export const updateMap = (
  { vehicles, centerOnVehicle }: Props,
  state: State,
  labelSetting: VehicleLabelSetting
): void => {
  vehicles.forEach(v => updateVehicle(v, state, labelSetting, centerOnVehicle))
}

export const updateMarkers = (
  newVehicles: { [id: string]: Vehicle },
  oldDict: MarkerDict,
  map: LeafletMap
): MarkerDict => {
  const newDict = Object.entries(oldDict).reduce(
    (acc, [vehicleId, existingMarkers]) => {
      const newValue = newVehicles[vehicleId] ? existingMarkers : null
      acc[vehicleId] = newValue
      return acc
    },
    {} as MarkerDict
  )

  return Object.entries(newVehicles).reduce((acc, [id, vehicle]) => {
    if (acc[id] === undefined) {
      acc[id] = {
        icon: Leaflet.marker([vehicle.latitude, vehicle.longitude]).addTo(map),
        label: Leaflet.marker([vehicle.latitude, vehicle.longitude]).addTo(map),
      }
    }
    return acc
  }, newDict)
}

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const [{ settings }] = useContext(StateDispatchContext)
  const containerRef: MutableRefObject<HTMLDivElement | null> = useRef(null)
  const [state, updateState] = useState<State>({
    map: null,
    markers: {},
  })

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const map =
      state.map ||
      Leaflet.map(containerRef.current, {
        layers: [
          Leaflet.tileLayer(
            `https://mbta-map-tiles-dev.s3.amazonaws.com/osm_tiles/{z}/{x}/{y}.png`,
            {
              attribution:
                '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            }
          ),
        ],
        zoom: 16,
      })

    const newVehicles = props.vehicles.reduce(
      (acc, vehicle) => {
        acc[vehicle.id] = vehicle
        return acc
      },
      {} as { [id: string]: Vehicle }
    )

    const markers = updateMarkers(newVehicles, state.markers, map)

    updateMap(props, { map, markers }, settings.vehicleLabel)

    updateState({ map, markers })
  }, [props, containerRef])

  return (
    <div
      id="id-vehicle-map"
      ref={container => (containerRef.current = container)}
      className="m-vehicle-map"
    />
  )
}

export default Map
