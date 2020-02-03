import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const useAppcues = () => {
  const location = useLocation()
  useEffect(() => {
    if (window.Appcues) {
      window.Appcues.page()
      window.Appcues.identify(window.username)
    }
  }, [location])
}

export default useAppcues
