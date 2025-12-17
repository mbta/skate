import {
  array,
  coerce,
  date,
  enums,
  literal,
  Infer,
  number,
  string,
  type,
  nullable,
} from "superstruct"

export type DetourId = number
export interface SimpleDetour {
  id: DetourId
  route: string
  direction: string
  name: string
  intersection: string
  updatedAt: number
  activatedAt: Date | null
  estimatedDuration: string | null
  status: "active" | "draft" | "past"
}

export interface SimpleActiveDetour extends SimpleDetour {
  activatedAt: Date
  estimatedDuration: string
  status: "active"
}

export const detourStatus = enums(["active", "draft", "past"])
export const detourId = number()
export const SimpleDetourData = type({
  id: detourId,
  route: string(),
  direction: string(),
  name: string(),
  intersection: string(),
  updated_at: number(),
  status: detourStatus,
  activated_at: nullable(
    coerce(date(), string(), (dateStr) => new Date(dateStr))
  ),
  estimated_duration: nullable(string()),
})

export const SimpleActiveDetourData = type({
  id: detourId,
  route: string(),
  direction: string(),
  name: string(),
  intersection: string(),
  updated_at: number(),
  status: literal("active"),
  activated_at: coerce(date(), string(), (dateStr) => new Date(dateStr)),
  estimated_duration: string(),
})

export type SimpleDetourData = Infer<typeof SimpleDetourData>
export type SimpleActiveDetourData = Infer<typeof SimpleActiveDetourData>

export const simpleDetourFromData = (
  detourData: SimpleDetourData
): SimpleDetour => ({
  id: detourData.id,
  route: detourData.route,
  direction: detourData.direction,
  name: detourData.name,
  intersection: detourData.intersection,
  updatedAt: detourData.updated_at,
  status: detourData.status,
  activatedAt: detourData.activated_at,
  estimatedDuration: detourData.estimated_duration,
})

export const simpleDetourFromActiveData = (
  detourData: SimpleActiveDetourData
): SimpleActiveDetour => ({
  ...simpleDetourFromData(detourData),
  status: detourData.status,
  activatedAt: detourData.activated_at,
  estimatedDuration: detourData.estimated_duration,
})

export interface GroupedSimpleDetours {
  active: SimpleActiveDetour[]
  draft: SimpleDetour[]
  past: SimpleDetour[]
}

export const GroupedDetoursData = type({
  active: array(SimpleActiveDetourData),
  draft: array(SimpleDetourData),
  past: array(SimpleDetourData),
})

export type GroupedDetoursData = Infer<typeof GroupedDetoursData>

export const groupedDetoursFromData = (
  groupedDetours: GroupedDetoursData
): GroupedSimpleDetours => ({
  active: groupedDetours.active
    .map(simpleDetourFromActiveData)
    .sort((a, b) => b.activatedAt.getTime() - a.activatedAt.getTime()),
  draft: groupedDetours.draft.map((detour) => simpleDetourFromData(detour)),
  past: groupedDetours.past.map((detour) => simpleDetourFromData(detour)),
})
