import { array, Infer, number, string, type } from "superstruct"
import { DraftDetours } from "./models/detours"

export const DraftDetoursData = array(
  type({
    route: string(),
    direction: string(),
    name: string(),
    intersection: string(),
    active_since: number(),
  })
)
export type DraftDetoursData = Infer<typeof DraftDetoursData>

export const draftDetoursFromData = (
  draftDetoursData: DraftDetoursData
): DraftDetours =>
  draftDetoursData.map((draft) => ({
    route: draft.route,
    direction: draft.direction,
    name: draft.name,
    intersection: draft.intersection,
    activeSince: draft.active_since,
  }))
