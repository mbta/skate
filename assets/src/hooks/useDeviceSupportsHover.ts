import { useMediaQuery } from "@react-hook/media-query"

const useDeviceSupportsHover = (): boolean => {
  return !useMediaQuery("(hover: none)")
}

export default useDeviceSupportsHover
