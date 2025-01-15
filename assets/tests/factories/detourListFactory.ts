import { Factory } from "fishery"
import {
  GroupedSimpleDetours,
  SimpleDetourData,
  simpleDetourFromData,
} from "../../src/models/detoursList"

export const detourListFactory = Factory.define<GroupedSimpleDetours>(() => {
  return {
    active: [
      simpleDetourFromData(simpleDetourDataFactory.build()),
      simpleDetourFromData(
        simpleDetourDataFactory.build({ direction: "Outbound" })
      ),
    ],
    draft: undefined,
    past: [
      simpleDetourFromData(
        simpleDetourDataFactory.build({ name: "Headsign Z" })
      ),
    ],
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
