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

          <div className="c-page__section-row">
            <div className="c-page__section-row-icon">
              {ladderIcon("c-page__section-row-icon-path")}
            </div>
            <div className="c-page__section-row-label">Route Ladders</div>
            <select
              id="ladder-vehicle-label-setting"
              className="c-page__select"
              value={settings.ladderVehicleLabel}
              onChange={setLadderVehicleLabel(dispatch)}
            >
              <option value={VehicleLabelSetting.RunNumber}>Run #</option>
              <option value={VehicleLabelSetting.VehicleNumber}>
                Vehicle #
              </option>
            </select>
          </div>

          <div className="c-page__section-row">
            <div className="c-page__section-row-icon">
              {mapIcon("c-page__section-row-icon-path")}
            </div>
            <div className="c-page__section-row-label">Map</div>
            <select
              id="map-vehicle-label-setting"
              className="c-page__select"
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
