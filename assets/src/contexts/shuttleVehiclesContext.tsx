import React, { Context, createContext, ReactElement } from "react"
import { Vehicle } from "../realtime"

interface Props {
  shuttles: Vehicle[]
  children: ReactElement<HTMLElement>
}

export const ShuttleVehiclesContext: Context<Vehicle[]> = createContext(
  [] as Vehicle[]
)

export const ShuttleVehiclesProvider = ({ shuttles, children }: Props) => (
  <ShuttleVehiclesContext.Provider value={shuttles}>
    {children}
  </ShuttleVehiclesContext.Provider>
)
