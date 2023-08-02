import { byRole } from "testing-library-selector"

export const listbox = (name = "Search Suggestions") =>
  byRole("listbox", { name, hidden: true })

export const optionGroup = (name: string) => byRole("group", { name })

export const option = (name: string) => byRole("option", { name })
