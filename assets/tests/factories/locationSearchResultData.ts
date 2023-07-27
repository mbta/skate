import { Factory } from "fishery"
import { LocationSearchResultData } from "../../src/models/locationSearchResultData"

const locationSearchResultDataFactory =
  Factory.define<LocationSearchResultData>(({ sequence }) => ({
    id: `${sequence}`,
    address: `${sequence} Test St`,
    name: "Some Landmark",
    latitude: 1,
    longitude: 2,
  }))

export default locationSearchResultDataFactory
