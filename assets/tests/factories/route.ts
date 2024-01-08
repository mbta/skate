import { Factory } from "fishery"
import { Route } from "../../src/schedule"

const routeFactory = Factory.define<Route>(({ sequence }) => ({
  id: sequence.toString(),
  directionNames: {
    0: "Outbound",
    1: "Inbound",
  },
  name: `Route ${sequence}`,
  garages: ["Garage A"],
}))

export default routeFactory
