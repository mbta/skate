import { Factory } from "fishery"
import { Swing } from "../../src/schedule"

export const swingFactory = Factory.define<Swing>(() => ({
  blockId: "A12-34",
  fromRouteId: "1",
  fromRunId: "123-456",
  fromTripId: "1234",
  toRouteId: "1",
  toRunId: "123-789",
  toTripId: "5678",
  time: 1000,
}))
