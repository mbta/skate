import Leaflet, { Map as LeafletMap, Marker } from "leaflet"
import React, {
  MutableRefObject,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react"
import { ScheduleAdherenceStatus } from "../skate"

interface Props {
  bearing: number
  label: string
  latitude: number
  longitude: number
  scheduleAdherenceStatus: ScheduleAdherenceStatus
}

interface State {
  map: LeafletMap | null
  vehicleIcon: Marker | null
  vehicleLabel: Marker | null
}

const iconAnchor: [number, number] = [12, 12]

export const updateMap = (
  { bearing, latitude, longitude, scheduleAdherenceStatus }: Props,
  {
    map,
    vehicleIcon,
    vehicleLabel,
  }: {
    map: LeafletMap
    vehicleIcon: Marker
    vehicleLabel: Marker
  }
): {
  map: LeafletMap
  vehicleIcon: Marker
  vehicleLabel: Marker
} => {
  const zoom = map.getZoom()

  const icon = Leaflet.divIcon({
    className: `m-vehicle-properties-panel__map-icon ${scheduleAdherenceStatus}`,
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

  map.setView([latitude, longitude], zoom)

  vehicleIcon.setLatLng([latitude, longitude])
  vehicleLabel.setLatLng([latitude, longitude])

  vehicleIcon.setIcon(icon)

  return { map, vehicleIcon, vehicleLabel }
}

// exported for tests only.
export const mapOptions = {
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
}

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const containerRef: MutableRefObject<HTMLDivElement | null> = useRef(null)
  const [state, updateState] = useState<State>({
    map: null,
    vehicleIcon: null,
    vehicleLabel: null,
  })

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const map = state.map || Leaflet.map(containerRef.current, mapOptions)

    const vehicleIcon =
      state.vehicleIcon ||
      Leaflet.marker([props.latitude, props.longitude]).addTo(map)

    const vehicleLabel =
      state.vehicleLabel ||
      Leaflet.marker([props.latitude, props.longitude], {
        icon: Leaflet.divIcon({
          className: "m-vehicle-properties-panel__map-label",
          html: `<svg>
            <text class="m-vehicle-icon__label">${props.label}</text>
          </svg>`,
          iconAnchor: [0, -20],
        }),
      }).addTo(map)

    const updated = updateMap(props, { map, vehicleIcon, vehicleLabel })

    updateState(updated)
  }, [props])

  return (
    <div
      ref={container => (containerRef.current = container)}
      className={`m-vehicle-properties-panel__map ${
        props.scheduleAdherenceStatus
      }`}
    />
  )
}

export default Map
