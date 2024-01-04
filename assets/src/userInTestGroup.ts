import getTestGroups from "./userTestGroups"

export enum TestGroups {
  DemoMode = "demo-mode",
  DummyDetourPage = "dummy-detour-page",
  MapBeta = "map-beta",
  LateView = "late-view",
  SearchMapsOnMobile = "search-maps-on-mobile",
}

const inTestGroup = (key: TestGroups): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
