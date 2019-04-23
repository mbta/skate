import { useEffect } from "react"
import { fetchRoutes } from "../api"
import { Route } from "../skate"
import { Dispatch, setRoutes } from "../state"

export const useFetchRoutes = (dispatch: Dispatch): void => {
  useEffect(() => {
    fetchRoutes().then((newRoutes: Route[]) => dispatch(setRoutes(newRoutes)))
  }, [])
}
