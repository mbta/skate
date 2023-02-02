import { ReactElement, useState } from "react"
import { useMap } from "react-leaflet"

const ZoomLevelWrapper = ({
  render,
}: {
  render: (zoomLevel: number) => ReactElement
}) => {
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState(map.getZoom())
  map.addEventListener("zoomend", () => setZoomLevel(map.getZoom()))
  return render(zoomLevel)
}
export default ZoomLevelWrapper
