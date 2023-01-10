import { Factory } from "fishery"
import { SearchPageState } from "../../src/state/searchPageState"
import { emptySearchQueryFactory } from "./searchQuery"

export const searchPageStateFactory = Factory.define<SearchPageState>(() => ({
  query: emptySearchQueryFactory.build(),
  isActive: false,
  savedQueries: [],
  selectedVehicleId: null,
}))
