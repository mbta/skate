import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ladderIcon, mapIcon } from "../helpers/icon"
import { VehicleLabelSetting } from "../settings"
import {
  setLadderVehicleLabelSetting,
  setShuttleVehicleLabelSetting,
} from "../state"

const SettingsPage = (): ReactElement<HTMLDivElement> => {
  const [{ settings }, dispatch] = useContext(StateDispatchContext)

  return (
    <div className="c-page c-page--settings">
      <div className="c-page__container">
        <h1 className="c-page__title">Settings</h1>

        <div className="c-page__section">
          <h2 className="c-page__header">Vehicle Label</h2>

          <DropdownSetting
            icon={ladderIcon}
            label="Route Ladders"
            selectId="ladder-vehicle-label-setting"
            value={settings.ladderVehicleLabel}
            onChange={(value) => {
              dispatch(setLadderVehicleLabelSetting(parseInt(value, 10)))
            }}
            options={[
              { label: "Run #", value: VehicleLabelSetting.RunNumber },
              { label: "Vehicle #", value: VehicleLabelSetting.VehicleNumber },
            ]}
          />
          <DropdownSetting
            icon={mapIcon}
            label="Map"
            selectId="map-vehicle-label-setting"
            value={settings.shuttleVehicleLabel}
            onChange={(value) => {
              dispatch(setShuttleVehicleLabelSetting(parseInt(value, 10)))
            }}
            options={[
              { label: "Run #", value: VehicleLabelSetting.RunNumber },
              { label: "Vehicle #", value: VehicleLabelSetting.VehicleNumber },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

const DropdownSetting = ({
  icon,
  label,
  selectId,
  value,
  onChange,
  options,
}: {
  icon: (className: string) => ReactElement
  label: string
  selectId: string
  value: string | number
  onChange: (value: string) => void
  options: { label: string; value: string | number }[]
}) => (
  <div className="m-settings-page__row">
    <div className="m-settings-page__icon">
      {icon("m-settings-page__icon-path")}
    </div>
    <div className="m-settings-page__label">{label}</div>
    <select
      id={selectId}
      className="m-settings-page__select"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
)

export default SettingsPage
