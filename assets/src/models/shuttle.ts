import { RunId, Vehicle } from "../realtime"

export enum ShuttleVariant {
  // Rapid Transit Lines
  Blue = "Blue",
  Green = "Green",
  Orange = "Orange",
  Red = "Red",

  // Other Shuttle Types
  CommuterRail = "CR",
  Special = "Special",
}

export const shuttleVariantFromRunId = (
  runId: RunId
): ShuttleVariant | null => {
  switch (runId) {
    case "999-0501":
      return ShuttleVariant.Blue
    case "999-0502":
      return ShuttleVariant.Green
    case "999-0503":
      return ShuttleVariant.Orange
    case "999-0504":
      return ShuttleVariant.Red
    case "999-0505":
      return ShuttleVariant.CommuterRail
    case "999-0555":
      return ShuttleVariant.Special
    default:
      return null
  }
}

const prefix = (variant: ShuttleVariant | null): string => {
  switch (variant) {
    case null:
      return ""
    case ShuttleVariant.CommuterRail:
      return "Commuter Rail "
    default:
      return variant + " "
  }
}

export const formattedRunNumber = ({ runId }: Vehicle): string => {
  if (runId === null) {
    return "Not Available"
  }

  const [area, run] = runId.split("-")

  // Remove leading zero from the run portion
  return `${prefix(shuttleVariantFromRunId(runId))}${area} ${run.slice(1)}`
}
