import appData from "./appData"

const featureIsEnabled = (key: string): boolean => {
  const data = appData()

  if (data === undefined || data.laboratoryFeatures === undefined) {
    return false
  }

  const features = JSON.parse(data.laboratoryFeatures)
  return features[key]
}

export default featureIsEnabled
