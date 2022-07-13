import { Factory } from "fishery"
import { Notification } from "../../src/realtime"

export default Factory.define<Notification>(({ sequence }) => ({
  id: `${sequence}`,
  createdAt: new Date(),
  reason: "manpower",
  routeIds: ["route1", "route2"],
  runIds: ["run1", "run2"],
  tripIds: [],
  operatorName: null,
  operatorId: null,
  routeIdAtCreation: null,
  startTime: new Date(),
  endTime: new Date(),
  state: "unread",
}))
