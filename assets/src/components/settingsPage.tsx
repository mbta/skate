import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  ladderIcon,
  mapIcon,
  triangleUpIcon,
  triangleUpLargeIcon,
} from "../helpers/icon"
import {
  setLadderVehicleLabelSetting,
  setShuttleVehicleLabelSetting,
  setVehicleAdherenceColorsSetting,
} from "../state"
import {
  putLadderVehicleLabel,
  putShuttleVehicleLabel,
  putVehicleAdherenceColors,
  VehicleLabelSetting,
  VehicleAdherenceColorsSetting,
} from "../userSettings"
import RightPanel from "./rightPanel"

const SettingsPage = (): ReactElement<HTMLDivElement> => {
  const [{ userSettings }, dispatch] = useContext(StateDispatchContext)

  return (
    <div className="c-page c-page--settings">
      <div className="c-page__container">
        <h1 className="c-page__title">Settings</h1>

        <div className="c-page__section">
          <h2 className="m-settings-page__section-header">Vehicle Settings</h2>
          <ToggleSetting
            icon={mapIcon}
            label="Vehicle labels on map"
            settingName="shuttle-vehicle-label"
            value={userSettings.shuttleVehicleLabel}
            onChange={(value) => {
              const newSetting: VehicleLabelSetting = parseInt(value, 10)
              dispatch(setShuttleVehicleLabelSetting(newSetting))
              putShuttleVehicleLabel(newSetting)
            }}
            options={[
              {
                label: "Run number",
                value: VehicleLabelSetting.RunNumber,
                optionId: "shuttle-vehicle-label-run-number",
              },
              {
                label: "Vehicle number",
                value: VehicleLabelSetting.VehicleNumber,
                optionId: "shuttle-vehicle-label-vehicle-number",
              },
            ]}
          />
          <ToggleSetting
            icon={ladderIcon}
            label="Vehicle labels on route ladder"
            settingName="ladder-vehicle-label"
            value={userSettings.ladderVehicleLabel}
            onChange={(value) => {
              const newSetting: VehicleLabelSetting = parseInt(value, 10)
              dispatch(setLadderVehicleLabelSetting(newSetting))
              putLadderVehicleLabel(newSetting)
            }}
            options={[
              {
                label: "Run number",
                value: VehicleLabelSetting.RunNumber,
                optionId: "ladder-vehicle-label-run-number",
              },
              {
                label: "Vehicle number",
                value: VehicleLabelSetting.VehicleNumber,
                optionId: "ladder-vehicle-label-vehicle-number",
              },
            ]}
          />
          <ToggleSetting
            icon={triangleUpLargeIcon}
            label="Adherence colors"
            settingName="vehicle-adherence-colors"
            value={userSettings.vehicleAdherenceColors}
            onChange={(value) => {
              const newSetting: VehicleAdherenceColorsSetting = parseInt(
                value,
                10
              )
              dispatch(setVehicleAdherenceColorsSetting(newSetting))
              putVehicleAdherenceColors(newSetting)
            }}
            options={[
              {
                label: (
                  <div>
                    <div className="m-settings-page__vehicle-adherence-setting-row">
                      Early bus: Red
                      <div className="m-settings-page__vehicle-adherence-icon">
                        {triangleUpIcon("red")}
                      </div>
                    </div>
                    <div className="m-settings-page__vehicle-adherence-setting-row">
                      Late bus: Blue
                      <div className="m-settings-page__vehicle-adherence-icon">
                        {triangleUpIcon("blue")}
                      </div>
                    </div>
                  </div>
                ),
                value: VehicleAdherenceColorsSetting.EarlyRed,
                optionId: "vehicle-adherence-colors-early-red",
              },
              {
                label: (
                  <div>
                    <div className="m-settings-page__vehicle-adherence-setting-row">
                      Early bus: Blue
                      <div className="m-settings-page__vehicle-adherence-icon">
                        {triangleUpIcon("blue")}
                      </div>
                    </div>
                    <div className="m-settings-page__vehicle-adherence-setting-row">
                      Late bus: Red
                      <div className="m-settings-page__vehicle-adherence-icon">
                        {triangleUpIcon("red")}
                      </div>
                    </div>
                  </div>
                ),
                value: VehicleAdherenceColorsSetting.EarlyBlue,
                optionId: "vehicle-adherence-colors-early-blue",
              },
            ]}
          />
        </div>
      </div>
      <RightPanel />
    </div>
  )
}

const ToggleSetting = ({
  icon,
  label,
  settingName,
  value,
  onChange,
  options,
}: {
  icon: (className: string) => ReactElement
  label: string
  settingName: string
  value: string | number
  onChange: (value: string) => void
  options: {
    label: string | JSX.Element
    value: string | number
    optionId: string
  }[]
}) => (
  <div className="m-settings-page__setting">
    <div className="m-settings-page__setting_header">
      <div className="m-settings-page__icon">
        {icon("m-settings-page__icon-path")}
      </div>
      <div className="m-settings-page__setting-label">{label}</div>
    </div>
    <div className="m-settings-page__options-container">
      {options.map((option) => (
        <label
          className={
            value === option.value
              ? "m-settings-page__option-label-selected"
              : "m-settings-page__option-label-unselected"
          }
          key={option.optionId}
          data-option-id={option.optionId}
        >
          <input
            type="radio"
            className="m-settings-page__input"
            name={settingName}
            value={option.value}
            checked={value === option.value}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  </div>
)

export default SettingsPage
