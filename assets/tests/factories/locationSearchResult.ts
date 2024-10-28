import { Factory } from "fishery"
import { LocationSearchResult } from "../../src/models/locationSearchResult"

const locationSearchResultFactory = Factory.define<LocationSearchResult>(
  ({ sequence }) => ({
    id: `${sequence}`,
    address: `${sequence} Test St`,
    name: "Some Landmark",
    latitude: 1,
    longitude: 2,
  })
)

export default locationSearchResultFactory
