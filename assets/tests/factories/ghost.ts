import { Factory } from "fishery"
import { Ghost } from "../../src/realtime"

export default Factory.define<Ghost>(({ sequence }) => ({
  id: `ghost-trip-${sequence}`,
  directionId: 0,
  routeId: "1",
  tripId: `trip-${sequence}`,
  headsign: "headsign",
  blockId: "block",
  runId: null,
  viaVariant: null,
  layoverDepartureTime: null,
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
  scheduledLogonTime: null,
  routeStatus: "on_route",
  blockWaivers: [],
  currentPieceStartPlace: "garage",
  currentPieceFirstRoute: "route",
}))
