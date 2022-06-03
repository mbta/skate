import { Location } from "history"

export const locationForPath = (path: string): Location<unknown> => {
  return {
    pathname: path,
    search: "",
    state: null,
    hash: "",
  }
}
