import {
  array,
  boolean,
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
  updatedAt: number
  status: "active" | "draft" | "past"
  intersection: string | null
  activatedAt: Date | null
  estimatedDuration: string | null
  reason: string | null
  isTextOnly: boolean
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
  updated_at: number(),
  status: detourStatus,
  intersection: nullable(string()),
  activated_at: nullable(
    coerce(date(), string(), (dateStr) => new Date(dateStr))
  ),
  estimated_duration: nullable(string()),
  reason: nullable(string()),
  is_text_only: boolean(),
})

export const SimpleActiveDetourData = type({
  id: detourId,
  route: string(),
  direction: string(),
  name: string(),
  updated_at: number(),
  status: literal("active"),
  activated_at: coerce(date(), string(), (dateStr) => new Date(dateStr)),
  intersection: nullable(string()),
  estimated_duration: string(),
  reason: nullable(string()),
  is_text_only: boolean(),
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
  isTextOnly: detourData.is_text_only,
  reason: detourData.reason,
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
