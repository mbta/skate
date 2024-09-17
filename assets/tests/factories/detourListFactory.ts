import { Factory } from "fishery"
import { GroupedSimpleDetours, SimpleDetour } from "../../src/models/detoursList"

export const detourListFactory = Factory.define<GroupedSimpleDetours>(() => {
  return {
    active: [
      simpleDetourFactory.build(),
      simpleDetourFactory.build({direction: "Outbound"})
    ],
    draft: null,
    past: [
      simpleDetourFactory.build({name: "Headsign Z"})
    ],
  }
})

const simpleDetourFactory = Factory.define<SimpleDetour>(
  ({sequence}) => ({
    uuid: sequence,
    route:`${sequence}`,
    direction: "Inbound",
    name: `Headsign ${sequence}`,
    intersection: `Street A${sequence} & Avenue B${sequence}`,
    updatedAt: 1724866392,
  })
)
