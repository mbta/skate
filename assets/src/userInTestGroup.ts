import getTestGroups from "./userTestGroups"

export enum TestGroups {
  BackwardsDetourPrevention = "backwards-detour-prevention",
  DemoMode = "demo-mode",
  DetoursList = "detours-list",
  DetoursPilot = "detours-pilot",
  DummyDetourPage = "dummy-detour-page",
  KeycloakSso = "keycloak-sso",
  MinimalLadderPage = "minimal-ladder-page",
  LateView = "late-view",
}

const inTestGroup = (key: TestGroups): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
