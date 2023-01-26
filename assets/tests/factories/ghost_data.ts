import { Factory } from "fishery"
import { GhostData } from "../../src/models/vehicleData"

export default Factory.define<GhostData>(({ sequence }) => ({
  id: `g${sequence}`,
  direction_id: 0,
  route_id: "1",
  route_pattern_id: "1-_-0",
  trip_id: "trip",
  headsign: "headsign",
  block_id: "block",
  run_id: null,
  via_variant: null,
  layover_departure_time: null,
  scheduled_timepoint_status: {
    timepoint_id: "t0",
    fraction_until_timepoint: 0,
  },
  scheduled_logon: null,
  route_status: "on_route",
  block_waivers: [],
  current_piece_first_route: "route",
  current_piece_start_place: "garage",
  incoming_trip_direction_id: null,
}))
