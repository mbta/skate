import { Factory } from "fishery"
import { Route } from "../../src/schedule"

const routeFactory = Factory.define<Route>(({ sequence }) => ({
  id: `route${sequence}`,
  directionNames: {
    0: "Outbound",
    1: "Inbound",
  },
  name: sequence.toString(),
  garages: ["Garage A"],
}))

export default routeFactory
