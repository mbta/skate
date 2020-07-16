import { createContext } from "react"
import { Route } from "../schedule"

type RoutesData = Route[] | null

const RoutesContext = createContext(null as RoutesData)

export default RoutesContext
