import React, { ReactNode, useContext, useId } from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import vehicleLabel from "../helpers/vehicleLabel"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { useNearestIntersection } from "../hooks/useNearestIntersection"
import { emptyLadderDirectionsByRouteId } from "../models/ladderDirection"
import { currentRouteTab } from "../models/routeTab"
import { directionName } from "../models/vehicle"
import {
  drawnStatus,
  humanReadableScheduleAdherence,
  statusClasses,
} from "../models/vehicleStatus"
import { Vehicle } from "../realtime"
import { secondsToMinutes } from "../util/dateTime"
import { CloseButton2 } from "./closeButton"
import { RouteVariantName2 } from "./routeVariantName"
import StreetViewButton, {
  WorldPositionBearing as WorldPositionBearing,
} from "./streetViewButton"
import { Size, VehicleIcon2, vehicleOrientation } from "./vehicleIcon"

interface VehicleProp {
  vehicle: Vehicle
}

//#region Vehicle Properties Card
const VehiclePropertiesCard = ({
  vehicle,
  onClose,
}: VehicleProp & {
  onClose: () => void
  }): React.ReactElement => (
  <div className="m-vpc" title="Vehicle Properties Card">
    <div className="m-vpc__title-bar">
    </div>

    <div className="m-vpc__summary">
    </div>

    <div className="m-vpc__body">
      <div className="m-vpc__properties m-info-section">
      </div>

      <div className="m-vpc__location-info m-info-section">
      </div>
    </div>
  </div>
)
export default VehiclePropertiesCard
//#endregion
