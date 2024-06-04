import getTestGroups from "./userTestGroups"

export enum TestGroups {
  DemoMode = "demo-mode",
  DetourRouteSelection = "detour-route-selection",
  DetoursPilot = "detours-pilot",
  DummyDetourPage = "dummy-detour-page",
  KeycloakSso = "keycloak-sso",
  MinimalLadderPage = "minimal-ladder-page",
  LateView = "late-view",
  RouteLadderHeaderUpdate = "route-ladder-header-update",
  DetourRoutePicker = "detour-route-picker",
}

const inTestGroup = (key: TestGroups): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
