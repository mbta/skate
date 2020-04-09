import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import vehicleLabel from "../helpers/vehicleLabel"
import { drawnStatus } from "../models/vehicleStatus"
import { VehicleOrGhost } from "../realtime"
import { selectVehicle } from "../state"
import { Orientation, Size, VehicleIconSvgNode } from "./vehicleIcon"
import { blockWaiverAlertStyle } from "../models/blockWaiver"

export enum LayoverBoxPosition {
  Top = 1,
  Bottom,
}

interface Props {
  vehiclesAndGhosts: VehicleOrGhost[]
  position: LayoverBoxPosition
}

const LayoverVehicle = ({
  vehicleOrGhost,
  isBottomLayoverBox,
}: {
  vehicleOrGhost: VehicleOrGhost
  isBottomLayoverBox: boolean
}): ReactElement<SVGElement> => {
  const [{ settings }] = useContext(StateDispatchContext)
  const alertIconStyle = blockWaiverAlertStyle(vehicleOrGhost)

  return (
    <VehicleIconSvgNode
      label={vehicleLabel(vehicleOrGhost, settings)}
      orientation={isBottomLayoverBox ? Orientation.Right : Orientation.Left}
      size={Size.Small}
      status={drawnStatus(vehicleOrGhost)}
      variant={vehicleOrGhost.viaVariant}
      alertIconStyle={alertIconStyle}
    />
  )
}

export const byLayoverDeparture = (isBottomLayoverBox: boolean) => (
  a: VehicleOrGhost,
  b: VehicleOrGhost
): number => {
  const [lt, gt] = isBottomLayoverBox ? [1, -1] : [-1, 1]
  if (
    !a.layoverDepartureTime ||
    !b.layoverDepartureTime ||
    a.layoverDepartureTime === b.layoverDepartureTime
  ) {
    return 0
  }

  return a.layoverDepartureTime > b.layoverDepartureTime ? gt : lt
}

const LayoverBox = ({
  vehiclesAndGhosts,
  position,
}: Props): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)

  const isBottomLayoverBox = position === LayoverBoxPosition.Bottom
  const classModifier = isBottomLayoverBox ? "bottom" : "top"

  const numVehicles = vehiclesAndGhosts.length
  const widthPerVehicle = 30
  const boxWidth = numVehicles * widthPerVehicle

  return (
    <svg
      className={`m-layover-box m-layover-box--${classModifier}`}
      viewBox={`${-boxWidth / 2} ${-10} ${boxWidth} ${32}`}
      width={boxWidth}
      height={32}
    >
      {vehiclesAndGhosts
        .sort(byLayoverDeparture(isBottomLayoverBox))
        .map((vehicleOrGhost, index) => {
          const x = (index - (numVehicles - 1) / 2) * widthPerVehicle
          const y = 0
          return (
            <g
              transform={`translate(${x},${y})`}
              onClick={() => dispatch(selectVehicle(vehicleOrGhost.id))}
              key={vehicleOrGhost.id}
            >
              <LayoverVehicle
                vehicleOrGhost={vehicleOrGhost}
                isBottomLayoverBox={isBottomLayoverBox}
              />
            </g>
          )
        })}
    </svg>
  )
}

export default LayoverBox
