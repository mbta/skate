import React, { ReactElement, useContext } from "react"
import { ShuttleVehiclesContext } from "../contexts/shuttleVehiclesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { Vehicle, VehicleId } from "../realtime"
import Map from "./map"
import PickerContainer from "./pickerContainer"
import ShuttlePicker from "./shuttlePicker"
import VehiclePropertiesPanel from "./vehiclePropertiesPanel"

const findSelectedVehicle = (
  vehicles: Vehicle[],
  selectedVehicleId: VehicleId | undefined
): Vehicle | undefined =>
  vehicles.find(vehicle => vehicle.id === selectedVehicleId)

const ShuttleMapPage = ({}): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const shuttles = useContext(ShuttleVehiclesContext)
  const selectedShuttles = shuttles.filter(shuttle =>
    state.selectedShuttleRunIds.includes(shuttle.runId!)
  )
  const selectedVehicle = findSelectedVehicle(
    selectedShuttles,
    state.selectedVehicleId
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

      {selectedVehicle && (
        <VehiclePropertiesPanel selectedVehicle={selectedVehicle} />
      )}
    </div>
  )
}

export default ShuttleMapPage
