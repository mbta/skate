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

const iconAnchor: [number, number] = [9, 3]

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
    html: `<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m14.0299939 2.61332371 6.6733353 18.14273779c.4766383 1.2958323-.1874496 2.7327035-1.4832819 3.2093418-.6765323.2488448-1.4275513.1935573-2.0603495-.1516762l-5.2486566-2.8634909-5.2330516 2.9015312c-1.20751921.6695242-2.72916353.233393-3.39868771-.9741262-.34268573-.     6180502-.40778353-1.3522644-.17918546-2.0209665l6.21797321-18.18900678c.44662479-1.30648061 1.86779756-2.00353147 3.17427816-1.55690667.7127229.24364673 1.2776061.79564851 1.5376261 1.50256246z" fill-rule="evenodd" transform="matrix(-1 0 0 1 24 0)"/></svg>`,
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
