import { useEffect } from "react"
import { useLocation } from "react-router-dom"

export const cleanUsername = (usernameWithPrefix: string): string =>
  usernameWithPrefix.replace(/^mbta-active-directory_/, "")

const useAppcues = () => {
  const location = useLocation()
  useEffect(() => {
    let username = document
      .querySelector("meta[name=username]")
      ?.getAttribute("content")

    if (username == undefined || username == null) username = ""

    if (window.Appcues) {
      window.Appcues.page()
      window.Appcues.identify(cleanUsername(username))
    }
  }, [location])
}

export default useAppcues
