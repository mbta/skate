import { createContext } from "react"
import { LeafletPaddingOptions } from "../components/stopCard"

export const MapSafeAreaContext = createContext<LeafletPaddingOptions>({})
