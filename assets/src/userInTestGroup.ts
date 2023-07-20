import getTestGroups from "./userTestGroups"

export enum TestGroups {
  DemoMode = "demo-mode",
  LocationSearch = "location-search",
  MapBeta = "map-beta",
  SearchLoggedOutVehicles = "search-logged-out-vehicles",
}

const inTestGroup = (key: TestGroups): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
