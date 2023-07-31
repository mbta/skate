import { Factory } from "fishery"
import { SearchProperties } from "../../src/models/searchQuery"

export const searchFiltersFactory = Factory.define<SearchProperties<boolean>>(
  () => ({
    location: true,
    operator: true,
    run: true,
    vehicle: true,
  })
)

export const searchFiltersOffFactory = searchFiltersFactory.params({
  location: false,
  operator: false,
  run: false,
  vehicle: false,
})
