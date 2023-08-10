import { Factory } from "fishery"
import { LocationSearchSuggestionData } from "../../src/models/locationSearchSuggestionData"

const locationSearchSuggestionDataFactory =
  Factory.define<LocationSearchSuggestionData>(({ sequence }) => ({
    text: "Some Search Term",
    place_id: `${sequence}`,
  }))

export default locationSearchSuggestionDataFactory
