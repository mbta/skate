import { describe, test, expect } from "@jest/globals"
import {
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
  })
})
