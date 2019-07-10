import Leaflet, { Map as LeafletMap, Marker } from "leaflet"
import "leaflet-rotatedmarker"
import React, { MutableRefObject, ReactElement, useEffect, useRef } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ScheduleAdherenceStatus, ViaVariant } from "../skate"
import VehicleIcon, { Orientation, Size } from "./vehicleIcon"

interface Props {
  bearing: number
  label: string
  latitude: number
  longitude: number
  scheduleAdherenceStatus: ScheduleAdherenceStatus
  viaVariant: ViaVariant | null
}

const Map = ({
  bearing,
  label,
  latitude,
  longitude,
  scheduleAdherenceStatus,
  viaVariant,
}: Props): ReactElement<HTMLDivElement> => {
  const mapRef: MutableRefObject<LeafletMap | null> = useRef(null)
  const markerRef: MutableRefObject<Marker | null> = useRef(null)
  useEffect(() => {
    if (latitude && longitude) {
      if (!mapRef.current) {
        mapRef.current = Leaflet.map("map", {
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
      }

      const zoom = mapRef.current.getZoom()

      mapRef.current.setView([latitude, longitude], zoom)

      const iconSvg = VehicleIcon({
        size: Size.Large,
        orientation: Orientation.Up,
        label,
        variant: viaVariant,
      })

      const icon = Leaflet.divIcon({
        className: scheduleAdherenceStatus,
        html: renderToStaticMarkup(iconSvg),
        iconAnchor: [34, 0],
      })

      if (!markerRef.current) {
        markerRef.current = Leaflet.marker([latitude, longitude], {
          // @ts-ignore
          rotationOrigin: "34px 0px",
        }).addTo(mapRef.current)
      }

      markerRef.current!.setLatLng([latitude, longitude])
      markerRef.current!.setIcon(icon)
      // rotationAngle property comes from leaflet-rotatedmarker
      // and is not part of the leaflet typespec
      // @ts-ignore
      markerRef.current.setRotationAngle(bearing)
    }
  })

  return <div id="map" className="m-vehicle-properties-panel__map" />
}

export default Map
