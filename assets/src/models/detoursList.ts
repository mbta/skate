import {
  array,
  coerce,
  date,
  Infer,
  nullable,
  number,
  string,
  type,
} from "superstruct"

export type DetourId = number
export interface SimpleDetour {
  id: DetourId
  route: string
  viaVariant: string
  direction: string
  name: string
  intersection: string
  updatedAt: number
  activatedAt?: Date
  estimatedDuration?: string
}

export const detourId = number()
export const SimpleDetourData = type({
  id: detourId,
  route: string(),
  via_variant: string(),
  direction: string(),
  name: string(),
  intersection: string(),
  updated_at: number(),
})

export type SimpleDetourData = Infer<typeof SimpleDetourData>

export const ActivatedDetourData = type({
  activated_at: coerce(date(), string(), (dateStr) => new Date(dateStr)),
  estimated_duration: string(),
  details: SimpleDetourData,
})

export type ActivatedDetourData = Infer<typeof ActivatedDetourData>

export const simpleDetourFromData = (
  detourData: SimpleDetourData
): SimpleDetour => ({
  id: detourData.id,
  route: detourData.route,
  viaVariant: detourData.via_variant,
  direction: detourData.direction,
  name: detourData.name,
  intersection: detourData.intersection,
  updatedAt: detourData.updated_at,
})

export const simpleDetourFromActivatedData = (
  detourData: ActivatedDetourData
) => ({
  ...simpleDetourFromData(detourData.details),
  activatedAt: detourData.activated_at,
  estimatedDuration: detourData.estimated_duration,
})

export interface GroupedSimpleDetours {
  active?: SimpleDetour[]
  draft?: SimpleDetour[]
  past?: SimpleDetour[]
}

export const GroupedDetoursData = type({
  active: nullable(array(ActivatedDetourData)),
  draft: nullable(array(SimpleDetourData)),
  past: nullable(array(SimpleDetourData)),
})

export type GroupedDetoursData = Infer<typeof GroupedDetoursData>

export const groupedDetoursFromData = (
  groupedDetours: GroupedDetoursData
): GroupedSimpleDetours => ({
  active: groupedDetours.active?.map(simpleDetourFromActivatedData),
  draft: groupedDetours.draft?.map((detour) => simpleDetourFromData(detour)),
  past: groupedDetours.past?.map((detour) => simpleDetourFromData(detour)),
})
