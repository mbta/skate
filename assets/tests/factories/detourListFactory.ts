import { Factory } from "fishery"
import {
  GroupedSimpleDetours,
  SimpleDetour,
} from "../../src/models/detoursList"

export const detourListFactory = Factory.define<GroupedSimpleDetours>(() => {
  return {
    active: [
      simpleDetourFactory.build(),
      simpleDetourFactory.build({ direction: "Outbound" }),
    ],
    draft: undefined,
    past: [simpleDetourFactory.build({ name: "Headsign Z" })],
  }
})

const simpleDetourFactory = Factory.define<SimpleDetour>(({ sequence }) => ({
  id: sequence,
  route: `${sequence}`,
  direction: "Inbound",
  name: `Headsign ${sequence}`,
  intersection: `Street A${sequence} & Avenue B${sequence}`,
  updatedAt: 1724866392,
}))
