import appData from "./appData"

const featureIsEnabled = (key: string): boolean => {
  const data = appData()

  if (key === "presets_workspaces") {
    return true
  }

  if (data === undefined || data.laboratoryFeatures === undefined) {
    return false
  }

  const features = JSON.parse(data.laboratoryFeatures)
  if (features[key] === undefined) {
    return false
  }

  return features[key]
}

export default featureIsEnabled
