import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import Map from "./map"
import PickerContainer from "./pickerContainer"
import ShuttlePicker from "./shuttlePicker"

const ShuttleMapPage = ({}): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const shuttles = useContext(ShuttleVehiclesContext)
  const selectedShuttles = shuttles.filter(shuttle =>
    state.selectedShuttleRunIds.includes(shuttle.runId!)
  )

  return (
    <div className="m-shuttle-map">
      <PickerContainer>
        <ShuttlePicker />
      </PickerContainer>
      <div
        className="m-shuttle-map__map"
        style={{
          height: window.innerHeight,
          width: window.innerWidth,
        }}
      >
        <Map
          vehicles={selectedShuttles}
          centerOnVehicle={null}
          initialZoom={13}
        />
      </div>
    </div>
  )
}

export default ShuttleMapPage
