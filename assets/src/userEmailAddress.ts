import appData from "./appData"

const getEmailAddress = (): string => {
  return appData()?.emailAddress ?? ""
}

export default getEmailAddress
