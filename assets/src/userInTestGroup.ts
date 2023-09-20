import getTestGroups from "./userTestGroups"

export enum TestGroups {
  DemoMode = "demo-mode",
  MapBeta = "map-beta",
  SearchLoggedOutVehicles = "search-logged-out-vehicles",
  PullBackMapLayer = "pull-back-map-layer",
}

const inTestGroup = (key: TestGroups): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
