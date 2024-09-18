import { array, Infer, nullable, number, string, type } from "superstruct"

export interface SimpleDetour {
  id: number
  route: string
  direction: string
  name: string
  intersection: string
  updatedAt: number
}

export const SimpleDetourData = type({
  id: number(),
  route: string(),
  direction: string(),
  name: string(),
  intersection: string(),
  updated_at: number(),
})

export type SimpleDetourData = Infer<typeof SimpleDetourData>

export const simpleDetourFromData = (
  detourData: SimpleDetourData
): SimpleDetour => ({
  id: detourData.id,
  route: detourData.route,
  direction: detourData.direction,
  name: detourData.name,
  intersection: detourData.intersection,
  updatedAt: detourData.updated_at,
})

export interface GroupedSimpleDetours {
  active?: SimpleDetour[]
  draft?: SimpleDetour[]
  past?: SimpleDetour[]
}

export const GroupedDetoursData = type({
  active: nullable(array(SimpleDetourData)),
  draft: nullable(array(SimpleDetourData)),
  past: nullable(array(SimpleDetourData)),
})

export type GroupedDetoursData = Infer<typeof GroupedDetoursData>

export const groupedDetoursFromData = (
  groupedDetours: GroupedDetoursData
): GroupedSimpleDetours => ({
  active: groupedDetours.active?.map((detour) => simpleDetourFromData(detour)),
  draft: groupedDetours.draft?.map((detour) => simpleDetourFromData(detour)),
  past: groupedDetours.past?.map((detour) => simpleDetourFromData(detour)),
})
