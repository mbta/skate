import { useEffect } from "react"
import { useLocation } from "react-router-dom"

export const cleanUsername = (usernameWithPrefix: string): string =>
  usernameWithPrefix.replace(/^mbta-active-directory_/, "")

const useAppcues = () => {

  const username = document
    .querySelector("meta[name=username]")
    ?.getAttribute("content")

  const location = useLocation()
  useEffect(() => {
    if (window.Appcues) {
      window.Appcues.page()
      window.Appcues.identify(cleanUsername(username))
    }
  }, [location])
}

export default useAppcues
