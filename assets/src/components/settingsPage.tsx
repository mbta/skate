import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  LadderIcon,
  MapIcon,
  TriangleUpIcon,
  TriangleUpLargeIcon,
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
import { Notifications } from "./notifications"

const SettingsPage = (): ReactElement<HTMLDivElement> => {
  const [{ userSettings, mobileMenuIsOpen }, dispatch] =
    useContext(StateDispatchContext)

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  return (
    <div className={`l-page c-settings-page ${mobileMenuClass}`}>
      <Notifications />
      <div className="c-page__container">
        <h1 className="c-page__title">Settings</h1>

        <div className="c-page__section">
          <h2 className="c-settings-page__section-header">Vehicle Settings</h2>
          <ToggleSetting
            icon={<MapIcon />}
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
            icon={<LadderIcon />}
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
            icon={<TriangleUpLargeIcon />}
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
                    <div className="c-settings-page__vehicle-adherence-setting-row">
                      Early bus: Red
                      <div className="c-settings-page__vehicle-adherence-icon">
                        <TriangleUpIcon className="red" />
                      </div>
                    </div>
                    <div className="c-settings-page__vehicle-adherence-setting-row">
                      Late bus: Blue
                      <div className="c-settings-page__vehicle-adherence-icon">
                        <TriangleUpIcon className="blue" />
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
                    <div className="c-settings-page__vehicle-adherence-setting-row">
                      Early bus: Blue
                      <div className="c-settings-page__vehicle-adherence-icon">
                        <TriangleUpIcon className="blue" />
                      </div>
                    </div>
                    <div className="c-settings-page__vehicle-adherence-setting-row">
                      Late bus: Red
                      <div className="c-settings-page__vehicle-adherence-icon">
                        <TriangleUpIcon className="red" />
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
  icon: ReactElement
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
  <div className="c-settings-page__setting">
    <div className="c-settings-page__setting_header">
      <div className="c-settings-page__icon">
        {React.cloneElement(icon, { className: "c-settings-page__icon-path" })}
      </div>
      <div className="c-settings-page__setting-label">{label}</div>
    </div>
    <div className="c-settings-page__options-container">
      {options.map((option) => (
        <label
          className={
            value === option.value
              ? "c-settings-page__option-label-selected"
              : "c-settings-page__option-label-unselected"
          }
          key={option.optionId}
        >
          <input
            type="radio"
            className="c-settings-page__input"
            data-testid={option.optionId}
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
