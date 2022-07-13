import { useMediaQueries } from "@react-hook/media-query"
import { DeviceType } from "../skate"

const maxMobileWidth = 480
const minTabletWidth = maxMobileWidth + 1
const maxTabletWidth = 1340

const useDeviceType = (): DeviceType => {
  const { matches } = useMediaQueries({
    mobile: `(max-width: ${maxMobileWidth}px)`,
    tablet: `(min-width: ${minTabletWidth}px) and (max-width: ${maxTabletWidth}px)`,
  })

  if (matches.mobile) {
    return "mobile"
  } else if (matches.tablet) {
    return "tablet"
  } else {
    return "desktop"
  }
}

export default useDeviceType
