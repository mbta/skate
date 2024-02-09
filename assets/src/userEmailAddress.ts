import appData from "./appData"

const getEmailAddress = () => {
  return appData()?.emailAddress
}

export default getEmailAddress
