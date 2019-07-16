import Leaflet, { Map as LeafletMap, Marker } from "leaflet"
import "leaflet-rotatedmarker"
import React, { MutableRefObject, ReactElement, useEffect, useRef } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Label, Orientation, Size } from "./vehicleIcon"

interface Props {
  bearing: number
  label: string
  latitude: number
  longitude: number
}

const iconAnchor: [number, number] = [12, 12]

export const updateMap = (
  { bearing, label: labelText, latitude, longitude }: Props,
  existingMap: LeafletMap | null,
  existingVehicleMarker: Marker | null,
  existingVehicleLabel: Marker | null
): {
  map: LeafletMap | null
  vehicleMarker: Marker | null
  vehicleLabel: Marker | null
} => {
  if (!latitude || !longitude) {
    return {
      map: existingMap,
      vehicleMarker: existingVehicleMarker,
      vehicleLabel: existingVehicleLabel,
    }
  }

  const map =
    existingMap ||
    Leaflet.map("map", {
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

  const vehicleMarker =
    existingVehicleMarker ||
    Leaflet.marker([latitude, longitude], {
      rotationOrigin: `${iconAnchor[0]}px ${iconAnchor[1]}px`,
    }).addTo(map)

  const vehicleLabel =
    existingVehicleLabel || Leaflet.marker([latitude, longitude], {}).addTo(map)

  const zoom = map.getZoom()

  map.setView([latitude, longitude], zoom)

  const icon = Leaflet.divIcon({
    className: `m-vehicle-properties-panel__map-icon`,
    html:
      '<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"/></svg>',
    iconAnchor,
  })

  const labelSvg = Label({
    size: Size.Medium,
    orientation: Orientation.Up,
    label: labelText,
  })

  const label = Leaflet.divIcon({
    className: "m-vehicle-properties-panel__map-label",
    html: `<svg>${renderToStaticMarkup(labelSvg)}</svg>`,
    iconAnchor: [0, -20],
  })

  vehicleMarker.setLatLng([latitude, longitude])
  vehicleLabel.setLatLng([latitude, longitude])

  vehicleMarker.setIcon(icon)
  vehicleLabel.setIcon(label)

  vehicleMarker.setRotationAngle(bearing)

  return { map, vehicleMarker, vehicleLabel }
}

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const mapRef: MutableRefObject<LeafletMap | null> = useRef(null)
  const vehicleMarkerRef: MutableRefObject<Marker | null> = useRef(null)
  const vehicleLabelRef: MutableRefObject<Marker | null> = useRef(null)

  useEffect(() => {
    const { map, vehicleMarker, vehicleLabel } = updateMap(
      props,
      mapRef.current,
      vehicleMarkerRef.current,
      vehicleLabelRef.current
    )
    mapRef.current = map
    vehicleMarkerRef.current = vehicleMarker
    vehicleLabelRef.current = vehicleLabel
  })

  return <div id="map" className="m-vehicle-properties-panel__map" />
}

export default Map
