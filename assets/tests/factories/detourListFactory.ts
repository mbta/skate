import { Factory } from "fishery"
import {
  ActivatedDetourData,
  GroupedSimpleDetours,
  SimpleDetourData,
  simpleDetourFromActivatedData,
  simpleDetourFromData,
} from "../../src/models/detoursList"

export const detourListFactory = Factory.define<GroupedSimpleDetours>(() => {
  return {
    active: [
      simpleDetourFromActivatedData(activeDetourDataFactory.build()),
      simpleDetourFromActivatedData(
        activeDetourDataFactory.build({ details: { direction: "Outbound" } })
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

export const activeDetourDataFactory = Factory.define<ActivatedDetourData>(
  () => ({
    details: simpleDetourDataFactory.build(),
    activated_at: new Date(),
  })
)
