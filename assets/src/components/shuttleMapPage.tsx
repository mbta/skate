import React, { ReactElement } from "react"
import Map from "./map"

const ShuttleMapPage = ({}): ReactElement<HTMLDivElement> => {
  return (
    <div
      className="m-shuttle-map"
      style={{
        height: window.innerHeight,
        width: window.innerWidth,
      }}
    >
      <Map vehicles={[]} centerOnVehicle={null} />
    </div>
  )
}

export default ShuttleMapPage
