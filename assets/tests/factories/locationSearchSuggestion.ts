import { Factory } from "fishery"
import { LocationSearchSuggestion } from "../../src/models/locationSearchSuggestion"

const locationSearchSuggestionFactory =
  Factory.define<LocationSearchSuggestion>(({ sequence }) => ({
    text: "Some Search Term",
    placeId: `${sequence}`,
  }))

export default locationSearchSuggestionFactory
