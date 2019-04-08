import { Route } from "./skate.d"

interface RoutesRequestResponse {
  data: Route[]
}

export const fetchRoutes = (): Promise<Route[]> =>
  fetch("/api/routes")
    .then((response: Response) => {
      if (response.status !== 200) {
        throw new Error(`Response error: ${response.status}`)
      }
      return response
    })
    .then((response: Response) => response.json())
    .then(({ data: routes }: RoutesRequestResponse) => routes)
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.log(`Error loading routes`, error)
      throw error
    })
