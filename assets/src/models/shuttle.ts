import { RunId, Vehicle } from "../realtime"

export enum ShuttleVariant {
  // Rapid Transit Lines
  Blue,
  Green,
  Orange,
  Red,

  // Other Shuttle Types
  CommuterRail,
  Special,
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
    case ShuttleVariant.Blue:
      return "Blue "
    case ShuttleVariant.Green:
      return "Green "
    case ShuttleVariant.Orange:
      return "Orange "
    case ShuttleVariant.Red:
      return "Red "
    case ShuttleVariant.CommuterRail:
      return "Commuter Rail "
    case ShuttleVariant.Special:
      return "Special "
    default:
      return ""
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
