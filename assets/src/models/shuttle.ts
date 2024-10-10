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

export const formattedRunNumber = ({ runId }: Vehicle): string => {
  if (runId === null) {
    return "Not Available"
  }

  const [area, run] = runId.split("-")

  // Remove leading zero from the run portion
  return `${prefix(run)}${area} ${run.slice(1)}`
}

const prefix = (run: string): string => {
  switch (run) {
    case "0501":
      return "Blue "
    case "0502":
      return "Green "
    case "0503":
      return "Orange "
    case "0504":
      return "Red "
    case "0505":
      return "Commuter Rail "
    case "0555":
      return "Special "
    default:
      return ""
  }
}
