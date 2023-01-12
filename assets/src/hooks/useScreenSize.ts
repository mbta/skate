import { useMediaQueries } from "@react-hook/media-query"
import { DeviceType } from "../skate"

const maxMobileWidth = 480
const minMobileLandscapeTabletPortraitWidth = maxMobileWidth + 1
const maxMobileLandscapeTabletPortraitWidth = 800
const minTabletWidth = maxMobileLandscapeTabletPortraitWidth + 1
const maxTabletWidth = 1340

const useScreenSize = (): DeviceType => {
  const { matches } = useMediaQueries({
    mobile: `(max-width: ${maxMobileWidth}px)`,
    mobile_landscape_tablet_portrait: `(min-width: ${minMobileLandscapeTabletPortraitWidth}px) and (max-width: ${maxMobileLandscapeTabletPortraitWidth}px)`,
    tablet: `(min-width: ${minTabletWidth}px) and (max-width: ${maxTabletWidth}px)`,
  })

  if (matches.mobile) {
    return "mobile"
  } else if (matches.mobile_landscape_tablet_portrait) {
    return "mobile_landscape_tablet_portrait"
  } else if (matches.tablet) {
    return "tablet"
  } else {
    return "desktop"
  }
}

export default useScreenSize
