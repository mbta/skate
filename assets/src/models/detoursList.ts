import { array, coerce, date, Infer, number, string, type } from "superstruct"

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
  active: SimpleDetour[]
  draft: SimpleDetour[]
  past: SimpleDetour[]
}

const MyNormalizedType = type({
  my_id: detourId,
  my_route: string(),
  my_via_variant: string(),
  my_direction: string(),
  my_name: string(),
  my_intersection: string(),
  my_updated_at: number(),
  my_activated_at: coerce(date(), string(), (dateStr) => new Date(dateStr)),
  my_estimated_duration: string(),
})

type MyNormalizedType = Infer<typeof MyNormalizedType>

export const GroupedDetoursData = type({
  active: array(MyNormalizedType),
  draft: array(MyNormalizedType),
  past: array(MyNormalizedType),
})

export type GroupedDetoursData = Infer<typeof GroupedDetoursData>

export const groupedDetoursFromData = (
  groupedDetours: GroupedDetoursData
): GroupedSimpleDetours => ({
  active: groupedDetours.active
    .map(fromNormalizedToActivatedData)
    .map(simpleDetourFromActivatedData)
    .sort((a, b) => b.activatedAt.getTime() - a.activatedAt.getTime()),
  draft: groupedDetours.draft.map(fromNormalizedToSimple).map((detour) => simpleDetourFromData(detour)),
  past: groupedDetours.past.map(fromNormalizedToSimple).map((detour) => simpleDetourFromData(detour)),
})

const fromNormalizedToSimple = ({
  my_id,
  my_route,
  my_via_variant,
  my_direction,
  my_name,
  my_intersection,
  my_updated_at,
}: MyNormalizedType): SimpleDetourData => ({
  id: my_id,
  route: my_route,
  via_variant: my_via_variant,
  direction: my_direction,
  name: my_name,
  intersection: my_intersection,
  updated_at: my_updated_at
})

const fromNormalizedToActivatedData = ({
  my_id,
  my_route,
  my_via_variant,
  my_direction,
  my_name,
  my_intersection,
  my_updated_at,
  my_activated_at,
  my_estimated_duration }: MyNormalizedType): ActivatedDetourData => ({
  activated_at: my_activated_at,
  estimated_duration: my_estimated_duration,
  details: {
    id: my_id,
    route: my_route,
    via_variant: my_via_variant,
    direction: my_direction,
    name: my_name,
    intersection: my_intersection,
    updated_at: my_updated_at
  }
})
