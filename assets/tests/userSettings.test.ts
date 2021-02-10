import {
  putMinischedulesTripLabel,
  TripLabelData,
  TripLabelSetting,
  userSettingsFromData,
  VehicleAdherenceColorsData,
  VehicleAdherenceColorsSetting,
  VehicleLabelData,
} from "../src/userSettings"

describe("userSettingsFromData", () => {
  test("parses vehicleAdherenceSettings data", () => {
    const data = {
      ladder_page_vehicle_label: "run_id" as VehicleLabelData,
      shuttle_page_vehicle_label: "run_id" as VehicleLabelData,
      vehicle_adherence_colors: "early_red" as VehicleAdherenceColorsData,
    }

    expect(userSettingsFromData(data).vehicleAdherenceColors).toEqual(
      VehicleAdherenceColorsSetting.EarlyRed
    )

    expect(
      userSettingsFromData({ ...data, vehicle_adherence_colors: "early_blue" })
        .vehicleAdherenceColors
    ).toEqual(VehicleAdherenceColorsSetting.EarlyBlue)

    expect(
      userSettingsFromData({ ...data, vehicle_adherence_colors: undefined })
        .vehicleAdherenceColors
    ).toEqual(VehicleAdherenceColorsSetting.EarlyRed)
  })
})

describe("userSettingsFromData", () => {
  test("parses minischedulesTripLabel", () => {
    const data = {
      ladder_page_vehicle_label: "run_id" as VehicleLabelData,
      shuttle_page_vehicle_label: "run_id" as VehicleLabelData,
      minischedules_trip_label: "origin" as TripLabelData,
    }

    expect(userSettingsFromData(data).minischedulesTripLabel).toEqual(
      TripLabelSetting.Origin
    )

    expect(
      userSettingsFromData({ ...data, minischedules_trip_label: "destination" })
        .minischedulesTripLabel
    ).toEqual(TripLabelSetting.Destination)

    expect(
      userSettingsFromData({ ...data, minischedules_trip_label: undefined })
        .minischedulesTripLabel
    ).toEqual(TripLabelSetting.Destination)
  })
})

describe("putMinischedulesTripLabel", () => {
  test("PUTs appropriately", () => {
    window.fetch = jest.fn()

    putMinischedulesTripLabel(TripLabelSetting.Origin)
    putMinischedulesTripLabel(TripLabelSetting.Destination)

    expect(window.fetch).toHaveBeenCalledTimes(2)

    const path1 = (window.fetch as jest.Mock).mock.calls[0][0]
    const path2 = (window.fetch as jest.Mock).mock.calls[1][0]

    expect(path1).toEqual(
      "/api/user_settings?field=minischedules_trip_label&value=origin"
    )
    expect(path2).toEqual(
      "/api/user_settings?field=minischedules_trip_label&value=destination"
    )
  })
})
