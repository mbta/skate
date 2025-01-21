import { Factory } from "fishery"
import {
  GroupedSimpleDetours,
  SimpleDetour,
  SimpleDetourData,
  simpleDetourFromData,
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

export const simpleDetourDataFactory = Factory.define<SimpleDetourData>(
  ({ sequence }) => ({
    id: sequence,
    route: `${sequence}`,
    direction: "Inbound",
    name: `Headsign ${sequence}`,
    intersection: `Street A${sequence} & Avenue B${sequence}`,
    updated_at: 1724866392,
  })
)

export const simpleDetourFactory = Factory.define<SimpleDetour>(() =>
  simpleDetourFromData(simpleDetourDataFactory.build())
)
