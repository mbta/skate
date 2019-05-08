import React, { useContext, useEffect } from "react"
import DispatchContext from "../contexts/dispatchContext"
import detectSwipe from "../helpers/detectSwipe"
import { SwipeDirection, Vehicle } from "../skate.d"
import { deselectVehicle } from "../state"
import CloseButton from "./closeButton"

interface Props {
  selectedVehicle: Vehicle
}

const VehiclePropertiesPanel = ({ selectedVehicle }: Props) => {
  const dispatch = useContext(DispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  useEffect(() => {
    const handleSwipe = (swipeDirection: SwipeDirection) => {
      if (swipeDirection === "Right") {
        hideMe()
      }
    }

    return detectSwipe("m-vehicle-properties-panel", handleSwipe)
  })

  return (
    <>
      <div
        id="m-vehicle-properties-panel"
        className="m-vehicle-properties-panel"
      >
        <div className="m-vehicle-properties-panel__header">
          <CloseButton onClick={hideMe} />
        </div>

        <dl className="m-vehicle-properties-panel__vehicle-properties">
          <div
            role="listitem"
            className="m-vehicle-properties-panel__vehicle-property"
          >
            <dt className="m-vehicle-properties-panel__vehicle-property-label">
              Vehicle
            </dt>
            <dd className="m-vehicle-properties-panel__vehicle-property-value">
              {selectedVehicle.label}
            </dd>
          </div>
        </dl>

        <hr className="m-vehicle-properties-panel__divider" />

        <button className="m-vehicle-properties-panel__close" onClick={hideMe}>
          Close vehicle properties
        </button>
      </div>

      <div
        className="m-vehicle-properties-panel__modal-overlay"
        onClick={hideMe}
      />
    </>
  )
}

export default VehiclePropertiesPanel
