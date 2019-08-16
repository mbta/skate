import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehicleLabelSetting } from "../settings"
import { Dispatch, setVehicleLabelSetting } from "../state"

const setVehicleLabel = (dispatch: Dispatch) => (
  event: React.FormEvent<HTMLSelectElement>
) => dispatch(setVehicleLabelSetting(parseInt(event.currentTarget.value, 10)))

const SettingsPage = (): ReactElement<HTMLDivElement> => {
  const [{ settings }, dispatch] = useContext(StateDispatchContext)

  return (
    <div className="c-page c-page--settings">
      <div className="c-page__container">
        <h1 className="c-page__title">Settings</h1>

        <div className="c-page__section">
          <h2 className="c-page__header">Vehicle Label</h2>

          <select
            id="vehicle-label-setting"
            className="c-page__select"
            value={settings.vehicleLabel}
            onChange={setVehicleLabel(dispatch)}
          >
            <option value={VehicleLabelSetting.RunNumber}>Run #</option>
            <option value={VehicleLabelSetting.VehicleNumber}>Vehicle #</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
