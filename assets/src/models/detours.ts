export interface DraftDetour {
  route: string
  direction: string
  name: string
  intersection: string
  activeSince: number
}

export type DraftDetours = DraftDetour[]
