import getTestGroups from "./userTestGroups"

export enum TestGroups {
  DemoMode = "demo-mode",
  DetoursList = "detours-list",
  DetoursNotifications = "detours-notifications",
  DetourExpirationNotifications = "detour-expiration-notifications",
  DetoursPilot = "detours-pilot",
  MinimalLadderPage = "minimal-ladder-page",
  LateView = "late-view",
  DeleteDraftDetours = "delete-draft-detours",
  DetoursOnLadder = "detours-on-ladder",
  MinischeduleTimepoints = "minischedule-timepoints",
  BatteryInfo = "battery-info",
}

const inTestGroup = (key: TestGroups): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
