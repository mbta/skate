export type OldSearchQueryType = "all" | "run" | "vehicle" | "operator"

export const searchPropertyDisplayConfig = {
  vehicle: { order: 0, name: "Vehicles" },
  operator: { order: 1, name: "Operators" },
  run: { order: 2, name: "Runs" },
}

export type SearchProperty = keyof typeof searchPropertyDisplayConfig

export interface SearchQuery {
  text: string
  property: OldSearchQueryType | string
  properties: { property: SearchProperty; limit: number }[]
}

export interface SavedSearchQuery {
  text: string
}

export const emptySearchQuery: SearchQuery = {
  text: "",
  property: "all",
  properties: [
    { property: "run", limit: 5 },
    { property: "vehicle", limit: 5 },
    { property: "operator", limit: 5 },
  ],
}

export const filterToAlphanumeric = (text: string): string =>
  text.replace(/[^0-9a-zA-Z]/g, "")

export const isValidSearchQuery = ({ text }: SearchQuery): boolean =>
  isValidSearchText(text)

export const isValidSearchText = (text: string): boolean =>
  filterToAlphanumeric(text).length >= 2
