import { ReactElement, useState } from "react"
import { useMap } from "react-leaflet"

const ZoomLevelWrapper = ({
  children,
}: {
  children: (zoomLevel: number) => ReactElement
}) => {
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState(map.getZoom())
  map.addEventListener("zoomend", () => setZoomLevel(map.getZoom()))
  return children(zoomLevel)
}
export default ZoomLevelWrapper
