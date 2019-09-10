import { Vehicle } from "../realtime"

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
