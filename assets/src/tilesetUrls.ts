import appData from "./appData"

export type TileType = "base" | "satellite"

export const tilesetUrlForType = (
  type: "base" | "satellite"
): string | undefined => {
  const data = appData()
  if (data?.tilesetUrls === undefined) {
    return undefined
  }
  const urls = JSON.parse(data.tilesetUrls)
  return urls[type]
}
