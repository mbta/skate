import { useMediaQuery } from "@react-hook/media-query"

const useDeviceSupportsHover = (): boolean => {
  return useMediaQuery("(hover: hover)")
}

export default useDeviceSupportsHover
