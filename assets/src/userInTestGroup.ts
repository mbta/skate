import getTestGroups from "./userTestGroups"

export enum TestGroups {
  BackwardsDetourPrevention = "backwards-detour-prevention",
  DemoMode = "demo-mode",
  DetoursList = "detours-list",
  DetoursPilot = "detours-pilot",
  MinimalLadderPage = "minimal-ladder-page",
  LateView = "late-view",
  CopyButton = "copy-button",
}

const inTestGroup = (key: TestGroups): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
