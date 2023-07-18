import { create, Infer, number, type } from "superstruct"
import appData from "./appData"

const MapLimits = type({
  north: number(),
  south: number(),
  east: number(),
  west: number(),
})
type MapLimits = Infer<typeof MapLimits>

const getMapLimits = (): MapLimits | null => {
  const mapLimitsJson = appData()?.mapLimits

  if (mapLimitsJson === undefined) {
    return null
  }

  const mapLimits = create(JSON.parse(mapLimitsJson) as unknown, MapLimits)

  return mapLimits
}

export default getMapLimits
