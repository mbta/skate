import { useEffect, useState } from "react"
import { DeviceType } from "../skate"

const maxMobileWidth = 480
const minMobileLandscapeTabletPortraitWidth = maxMobileWidth + 1
const maxMobileLandscapeTabletPortraitWidth = 800
const minTabletWidth = maxMobileLandscapeTabletPortraitWidth + 1
const maxTabletWidth = 1340

function getWidth() {
  // Return size of viewport, including any scrollbars
  return window.innerWidth
}

const useScreenSize = (): DeviceType => {
  // Initialize to current size
  const [screenWidth, setScreenWidth] = useState<number>(getWidth())

  useEffect(() => {
    const resizeHandler = () => setScreenWidth(getWidth())

    window.addEventListener("resize", resizeHandler)
    return () => window.removeEventListener("resize", resizeHandler)
  }, [])

  if (screenWidth <= maxMobileWidth) {
    return "mobile"
  } else if (
    minMobileLandscapeTabletPortraitWidth <= screenWidth &&
    screenWidth <= maxMobileLandscapeTabletPortraitWidth
  ) {
    return "mobile_landscape_tablet_portrait"
  } else if (minTabletWidth <= screenWidth && screenWidth <= maxTabletWidth) {
    return "tablet"
  } else {
    return "desktop"
  }
}

export default useScreenSize
