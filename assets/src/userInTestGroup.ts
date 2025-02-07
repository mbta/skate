import getTestGroups from "./userTestGroups"

export enum TestGroups {
  BackwardsDetourPrevention = "backwards-detour-prevention",
  DemoMode = "demo-mode",
  DetoursList = "detours-list",
  DetoursNotifications = "detours-notifications",
  DetoursPilot = "detours-pilot",
  MinimalLadderPage = "minimal-ladder-page",
  LateView = "late-view",
  CopyButton = "copy-button",
  DeleteDraftDetours = "delete-draft-detours",
  DetoursOnLadder = "detours-on-ladder",
}

const inTestGroup = (key: TestGroups): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
