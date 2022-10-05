export interface SearchQuery {
  text: string
  property: string
}

export interface SavedSearchQuery {
  text: string
}

export const emptySearchQuery: SearchQuery = {
  text: "",
  property: "all",
}

export const filterToAlphanumeric = (text: string): string =>
  text.replace(/[^0-9a-zA-Z]/g, "")

export const isValidSearchQuery = ({ text }: SearchQuery): boolean =>
  filterToAlphanumeric(text).length >= 1
