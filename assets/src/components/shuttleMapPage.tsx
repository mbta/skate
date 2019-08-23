import React, { ReactElement } from "react"
import Map from "./map"
import PickerContainer from "./pickerContainer"

const ShuttleMapPage = ({}): ReactElement<HTMLDivElement> => {
  return (
    <div className="m-shuttle-map">
      <PickerContainer>
        <div />
      </PickerContainer>
      <div
        className="m-shuttle-map__map"
        style={{
          height: window.innerHeight,
          width: window.innerWidth,
        }}
      >
        <Map vehicles={[]} centerOnVehicle={null} />
      </div>
    </div>
  )
}

export default ShuttleMapPage
