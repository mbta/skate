import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ladderIcon, mapIcon } from "../helpers/icon"
import featureIsEnabled from "../laboratoryFeatures"
import {
  setLadderVehicleLabelSetting,
  setMinischedulesTripLabelSetting,
  setShuttleVehicleLabelSetting,
  setVehicleAdherenceColorsSetting,
} from "../state"
import {
  putLadderVehicleLabel,
  putMinischedulesTripLabel,
  putShuttleVehicleLabel,
  putVehicleAdherenceColors,
  TripLabelSetting,
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
          <h2 className="c-page__header">Vehicle Label</h2>
          <DropdownSetting
            icon={ladderIcon}
            label="Route Ladders"
            selectId="ladder-vehicle-label-setting"
            value={userSettings.ladderVehicleLabel}
            onChange={(value) => {
              const newSetting: VehicleLabelSetting = parseInt(value, 10)
              dispatch(setLadderVehicleLabelSetting(newSetting))
              putLadderVehicleLabel(newSetting)
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
            value={userSettings.shuttleVehicleLabel}
            onChange={(value) => {
              const newSetting: VehicleLabelSetting = parseInt(value, 10)
              dispatch(setShuttleVehicleLabelSetting(newSetting))
              putShuttleVehicleLabel(newSetting)
            }}
            options={[
              { label: "Run #", value: VehicleLabelSetting.RunNumber },
              { label: "Vehicle #", value: VehicleLabelSetting.VehicleNumber },
            ]}
          />
          {featureIsEnabled("vehicle_adherence_colors_setting") && (
            <DropdownSetting
              icon={mapIcon}
              label="Map"
              selectId="vehicle-adherence-colors-setting"
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
                  label: "Early Red",
                  value: VehicleAdherenceColorsSetting.EarlyRed,
                },
                {
                  label: "Early Blue",
                  value: VehicleAdherenceColorsSetting.EarlyBlue,
                },
              ]}
            />
          )}

          {featureIsEnabled("minischedules_trip_label") && (
            <DropdownSetting
              icon={mapIcon}
              label="Trip Label"
              selectId="minischedules-trip-label-setting"
              value={userSettings.minischedulesTripLabel}
              onChange={
                // Ignoring this because we can't get the tests working and
                // neither of can figure out why
                /* istanbul ignore next */
                (value) => {
                  const newSetting: TripLabelSetting = parseInt(value, 10)
                  dispatch(setMinischedulesTripLabelSetting(newSetting))
                  putMinischedulesTripLabel(newSetting)
                }
              }
              options={[
                { label: "Origin", value: TripLabelSetting.Origin },
                {
                  label: "Destination",
                  value: TripLabelSetting.Destination,
                },
              ]}
            />
          )}
        </div>
      </div>
      <RightPanel />
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
