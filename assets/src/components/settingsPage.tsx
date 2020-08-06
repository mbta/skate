import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ladderIcon, mapIcon } from "../helpers/icon"
import { VehicleLabelSetting } from "../settings"
import {
  Dispatch,
  setLadderVehicleLabelSetting,
  setShuttleVehicleLabelSetting,
} from "../state"

const setLadderVehicleLabel = (dispatch: Dispatch) => (
  event: React.FormEvent<HTMLSelectElement>
) =>
  dispatch(
    setLadderVehicleLabelSetting(parseInt(event.currentTarget.value, 10))
  )

const setShuttleVehicleLabel = (dispatch: Dispatch) => (
  event: React.FormEvent<HTMLSelectElement>
) =>
  dispatch(
    setShuttleVehicleLabelSetting(parseInt(event.currentTarget.value, 10))
  )

const SettingsPage = (): ReactElement<HTMLDivElement> => {
  const [{ settings }, dispatch] = useContext(StateDispatchContext)

  return (
    <div className="c-page c-page--settings">
      <div className="c-page__container">
        <h1 className="c-page__title">Settings</h1>

        <div className="c-page__section">
          <h2 className="c-page__header">Vehicle Label</h2>

          <div className="m-settings-page__row">
            <div className="m-settings-page__icon">
              {ladderIcon("m-settings-page__icon-path")}
            </div>
            <div className="m-settings-page__label">Route Ladders</div>
            <select
              id="ladder-vehicle-label-setting"
              className="m-settings-page__select"
              value={settings.ladderVehicleLabel}
              onChange={setLadderVehicleLabel(dispatch)}
            >
              <option value={VehicleLabelSetting.RunNumber}>Run #</option>
              <option value={VehicleLabelSetting.VehicleNumber}>
                Vehicle #
              </option>
            </select>
          </div>

          <div className="m-settings-page__row">
            <div className="m-settings-page__icon">
              {mapIcon("m-settings-page__icon-path")}
            </div>
            <div className="m-settings-page__label">Map</div>
            <select
              id="map-vehicle-label-setting"
              className="m-settings-page__select"
              value={settings.shuttleVehicleLabel}
              onChange={setShuttleVehicleLabel(dispatch)}
            >
              <option value={VehicleLabelSetting.RunNumber}>Run #</option>
              <option value={VehicleLabelSetting.VehicleNumber}>
                Vehicle #
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
