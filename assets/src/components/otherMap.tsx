import React from "react"
import { Map } from "pigeon-maps"

import { TrainVehicle, Vehicle } from "../realtime.d"
import { Shape } from "../schedule"

const tileProvider = (x: number, y: number, z: number, _dpr?: number): string =>
  `https://mbta-map-tiles-dev.s3.amazonaws.com/osm_tiles/${z}/${x}/${y}.png`

export interface Props {
  vehicles: Vehicle[]
  shapes?: Shape[]
  // secondaryVehicles are smaller, deemphasized, and don't affect autocentering
  secondaryVehicles?: Vehicle[]
  // trainVehicles are white, don't get a label, and don't affect autocentering
  trainVehicles?: TrainVehicle[]
  //  reactLeafletRef?: MutableRefObject<ReactLeafletMap | null>
}
const OtherMap = (_props: Props) => (
  <Map
    provider={tileProvider}
    defaultCenter={[42.360718, -71.05891]}
    defaultZoom={13}
  />
)

export default OtherMap
