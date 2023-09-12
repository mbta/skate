import { Factory } from "fishery"
import { VehicleData } from "../../src/models/vehicleData"

export default Factory.define<VehicleData>(({ sequence }) => ({
  id: `v${sequence}`,
  label: `v${sequence}-label`,
  run_id: `run-${sequence}`,
  timestamp: 123,
  latitude: 0,
  longitude: 0,
  direction_id: 0,
  route_id: "39",
  route_pattern_id: "39-_-0",
  trip_id: `t${sequence}`,
  headsign: "Forest Hills",
  via_variant: "X",
  operator_id: `op${sequence}`,
  operator_first_name: "WILL",
  operator_last_name: "SMITH",
  operator_logon_time: Math.floor(
    new Date("2018-08-15T13:38:21.000Z").getTime() / 1000
  ),
  bearing: 33,
  block_id: `block-${sequence}`,
  previous_vehicle_id: `v${sequence + 1}`,
  schedule_adherence_secs: 0,
  incoming_trip_direction_id: null,
  is_shuttle: false,
  is_overload: false,
  is_off_course: false,
  is_revenue: true,
  layover_departure_time: null,
  pull_back_place_name: "Garage",
  overload_offset: null,
  sources: [],
  data_discrepancies: [
    {
      attribute: "trip_id",
      sources: [
        {
          id: "swiftly",
          value: "swiftly-trip-id",
        },
        {
          id: "busloc",
          value: "busloc-trip-id",
        },
      ],
    },
    {
      attribute: "route_id",
      sources: [
        {
          id: "swiftly",
          value: null,
        },
        {
          id: "busloc",
          value: "busloc-route-id",
        },
      ],
    },
  ],
  stop_status: {
    stop_id: "s1",
    stop_name: "Stop Name",
  },
  timepoint_status: {
    timepoint_id: "tp1",
    fraction_until_timepoint: 0.5,
  },
  scheduled_location: {
    route_id: "39",
    route_pattern_id: "39-_-0",
    direction_id: 0,
    trip_id: "scheduled trip",
    run_id: "scheduled run",
    time_since_trip_start_time: 0,
    headsign: "scheduled headsign",
    via_variant: "scheduled via variant",
    timepoint_status: {
      timepoint_id: "tp1",
      fraction_until_timepoint: 0.5,
    },
  },
  route_status: "on_route",
  end_of_trip_type: "another_trip",
  block_waivers: [],
  crowding: null,
}))
