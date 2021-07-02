import React, { useEffect, useState } from "react"
import { Map, Point } from "pigeon-maps"

import { TrainVehicle, Vehicle } from "../realtime.d"
import { Shape } from "../schedule"

const tileProvider = (x: number, y: number, z: number, _dpr?: number): string =>
  `https://mbta-map-tiles-dev.s3.amazonaws.com/osm_tiles/${z}/${x}/${y}.png`

const defaultCenter: Point = [42.360718, -71.05891]

export interface Props {
  vehicles: Vehicle[]
  shapes?: Shape[]
  // secondaryVehicles are smaller, deemphasized, and don't affect autocentering
  secondaryVehicles?: Vehicle[]
  // trainVehicles are white, don't get a label, and don't affect autocentering
  trainVehicles?: TrainVehicle[]
  //  reactLeafletRef?: MutableRefObject<ReactLeafletMap | null>
}

export const findVehicleCenter = (latLngs: Point[]): Point => {
  if (latLngs.length === 0) {
    return defaultCenter
  }
  if (latLngs.length === 1) {
    return latLngs[0]
  }

  return latLngs[0]
}

const OtherMap = ({ vehicles }: Props) => {
  const vehicleCoordinates: Point[] = vehicles.map((vehicle) => [
    vehicle.latitude,
    vehicle.longitude,
  ])

  const [useMyLocation, setUseMyLocation] = useState<boolean>(false)

  const [center, setCenter] = useState<Point>(
    findVehicleCenter(vehicleCoordinates)
  )

  useEffect(() => {
    const watchId = useMyLocation
      ? navigator.geolocation.watchPosition((position) =>
          setCenter([position.coords.latitude, position.coords.longitude])
        )
      : null

    if (!useMyLocation) {
      setCenter(findVehicleCenter(vehicleCoordinates))
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [useMyLocation])
  const toggleUseMyLocation = () => setUseMyLocation(!useMyLocation)

  const locationButtonText = useMyLocation ? "Autocenter" : "Center on me"

  return (
    <div style={{ position: "relative", height: "320px" }}>
      <Map provider={tileProvider} center={center} zoom={13} />

      <button
        style={{ position: "absolute", top: "10px", right: "10px" }}
        onClick={toggleUseMyLocation}
      >
        {locationButtonText}
      </button>
    </div>
  )
}

export default OtherMap
