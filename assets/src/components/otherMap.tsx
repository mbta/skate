import React from "react"
import { TrainVehicle, Vehicle } from "../realtime.d"
import { Shape } from "../schedule"

export interface Props {
  vehicles: Vehicle[]
  shapes?: Shape[]
  // secondaryVehicles are smaller, deemphasized, and don't affect autocentering
  secondaryVehicles?: Vehicle[]
  // trainVehicles are white, don't get a label, and don't affect autocentering
  trainVehicles?: TrainVehicle[]
  //  reactLeafletRef?: MutableRefObject<ReactLeafletMap | null>
}
const OtherMap = (_props: Props) => <div>fake map</div>

export default OtherMap
