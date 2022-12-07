import getTestGroups from "./userTestGroups"

export const MAP_BETA_GROUP_NAME = "map-beta"

const inTestGroup = (key: string): boolean => {
  return getTestGroups().includes(key)
}

export default inTestGroup
