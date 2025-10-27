import { Factory } from "fishery"
import {
  ActivatedDetourData,
  GroupedSimpleDetours,
  SimpleDetour,
  SimpleDetourData,
  simpleDetourFromActivatedData,
  simpleDetourFromData,
} from "../../src/models/detoursList"

export const detourListFactory = Factory.define<GroupedSimpleDetours>(() => {
  return {
    active: [
      simpleDetourFromActivatedData(activeDetourDataFactory.build()),
      simpleDetourFromActivatedData(
        activeDetourDataFactory.build({
          details: { name: "Headsign A", direction: "Outbound" },
        })
      ),
    ],
    draft: [],
    past: [simpleDetourFactory.build({ name: "Headsign Z", status: "past" })],
  }
})

export const detourListFactoryWithDraft = Factory.define<GroupedSimpleDetours>(
  () => {
    return {
      active: [
        simpleDetourFromActivatedData(activeDetourDataFactory.build()),
        simpleDetourFromActivatedData(
          activeDetourDataFactory.build({ details: { direction: "Outbound" } })
        ),
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
    via_variant: `${sequence}`,
    direction: "Inbound",
    name: `Headsign ${sequence}`,
    status: "active",
    intersection: `Street A${sequence} & Avenue B${sequence}`,
    updated_at: 1724866392,
  })
)

export const simpleDetourFactory = Factory.define<SimpleDetour>(() =>
  simpleDetourFromData(simpleDetourDataFactory.build())
)

export const activeDetourDataFactory = Factory.define<ActivatedDetourData>(
  () => ({
    details: simpleDetourDataFactory.build(),
    activated_at: new Date(),
    estimated_duration: "2 hours",
    status: "active",
  })
)
