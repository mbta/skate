import { Factory } from "fishery"
import {
  GroupedSimpleDetours,
  SimpleActiveDetourData,
  SimpleDetour,
  SimpleActiveDetour,
  SimpleDetourData,
  simpleDetourFromActiveData,
  simpleDetourFromData,
} from "../../src/models/detoursList"

export const detourListFactory = Factory.define<GroupedSimpleDetours>(() => {
  return {
    active: [
      simpleActiveDetourFactory.build(),
      simpleActiveDetourFactory.build({
        name: "Headsign A",
        direction: "Outbound",
      }),
    ],
    draft: [],
    past: [simpleDetourFactory.build({ name: "Headsign Z", status: "past" })],
  }
})

export const detourListFactoryWithDraft = Factory.define<GroupedSimpleDetours>(
  () => {
    return {
      active: [
        simpleActiveDetourFactory.build(),
        simpleActiveDetourFactory.build({ direction: "Outbound" }),
      ],
      draft: [
        simpleDetourFactory.build({
          status: "draft",
          id: 123,
          name: "Draft Detour 123",
        }),
      ],
      past: [simpleDetourFactory.build({ status: "past", name: "Headsign Z" })],
    }
  }
)

export const simpleDetourDataFactory = Factory.define<SimpleDetourData>(
  ({ sequence }) => ({
    id: sequence,
    route: `${sequence}`,
    direction: "Inbound",
    name: `Headsign ${sequence}`,
    status: "draft",
    intersection: `Street A${sequence} & Avenue B${sequence}`,
    updated_at: 1724866392,
    activated_at: null,
    estimated_duration: null,
  })
)

export const simpleActiveDetourDataFactory =
  Factory.define<SimpleActiveDetourData>(({ sequence }) => ({
    id: sequence,
    route: `${sequence}`,
    direction: "Inbound",
    name: `Headsign ${sequence}`,
    status: "active",
    intersection: `Street A${sequence} & Avenue B${sequence}`,
    updated_at: 1724866392,
    activated_at: new Date(),
    estimated_duration: "2 hours",
  }))

export const simpleDetourFactory = Factory.define<SimpleDetour>(() =>
  simpleDetourFromData(simpleDetourDataFactory.build())
)

export const simpleActiveDetourFactory = Factory.define<SimpleActiveDetour>(
  () =>
    simpleDetourFromActiveData(
      simpleActiveDetourDataFactory.build({
        activated_at: new Date(),
        estimated_duration: "2 hours",
      })
    )
)
