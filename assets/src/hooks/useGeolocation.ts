import { useState, useEffect } from "react"

const useGeolocation = (): GeolocationCoordinates | null => {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(
    null
  )

  useEffect(() => {
    const geolocation = navigator.geolocation

    const watchId = geolocation.watchPosition((location) =>
      setCoordinates(location.coords)
    )

    return () => {
      geolocation.clearWatch(watchId)
      setCoordinates(null)
    }
  }, [])

  return coordinates
}

export default useGeolocation
