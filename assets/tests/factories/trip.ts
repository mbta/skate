import { Factory } from "fishery";
import { Trip } from "../../src/minischedule";

export default Factory.define<Trip>(({sequence}) => ({
  id: `trip-${sequence}`,
  blockId: "block",
  routeId: "R",
  headsign: "Revenue",
  directionId: 1,
  viaVariant: "X",
  runId: "run",
  startTime: 0,
  endTime: 1,
  startPlace: "Red Square",
  endPlace: "Blue Triangle",
}));
