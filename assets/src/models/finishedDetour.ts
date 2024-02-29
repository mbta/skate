import { array, Infer, type } from "superstruct"
import { FinishedDetour } from "./detour"
import { StopData, stopsFromData } from "./stopData"

export const FinishedDetourData = type({
  missed_stops: array(StopData),
})
export type FinishedDetourData = Infer<typeof FinishedDetourData>

export const finishedDetourFromData = (
  finishedDetour: FinishedDetourData
): FinishedDetour => {
  return {
    missedStops: stopsFromData(finishedDetour.missed_stops),
  }
}
