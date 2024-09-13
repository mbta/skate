import { array, Infer, nullable, number, string, type } from "superstruct"

export const SimpleDetour = type({
  uuid: number(),
  route: string(),
  direction: string(),
  name: string(),
  intersection: string(),
  updatedAt: number(),
})

export type SimpleDetour = Infer<typeof SimpleDetour>

export const SimpleDetourFromApi = type({
  uuid: number(),
  route: string(),
  direction: string(),
  name: string(),
  intersection: string(),
  updated_at: number(),
})

export type SimpleDetourFromApi = Infer<typeof SimpleDetourFromApi>

export const simpleDetourFromData = (
  detourData: SimpleDetourFromApi
): SimpleDetour => ({
  uuid: detourData.uuid,
  route: detourData.route,
  direction: detourData.direction,
  name: detourData.name,
  intersection: detourData.intersection,
  updatedAt: detourData.updated_at,
})

export const GroupedSimpleDetours = type({
  active: nullable(array(SimpleDetour)),
  draft: nullable(array(SimpleDetour)),
  past: nullable(array(SimpleDetour)),
})

export type GroupedSimpleDetours = Infer<typeof GroupedSimpleDetours>

export const GroupedDetoursFromApi = type({
  active: nullable(array(SimpleDetourFromApi)),
  draft: nullable(array(SimpleDetourFromApi)),
  past: nullable(array(SimpleDetourFromApi)),
})

export type GroupedDetoursFromApi = Infer<typeof GroupedDetoursFromApi>

export const groupedDetoursFromData = (
  groupedDetours: GroupedDetoursFromApi
): GroupedSimpleDetours => ({
  active:
    groupedDetours.active?.map((detour) => simpleDetourFromData(detour)) ||
    null,
  draft:
    groupedDetours.draft?.map((detour) => simpleDetourFromData(detour)) || null,
  past:
    groupedDetours.past?.map((detour) => simpleDetourFromData(detour)) || null,
})
