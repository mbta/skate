import React, { Context, createContext, ReactElement } from "react"
import { Vehicle } from "../realtime"

interface Props {
  shuttles: Vehicle[] | null
  children: ReactElement<HTMLElement>
}

export const ShuttleVehiclesContext: Context<Vehicle[] | null> = createContext<
  Vehicle[] | null
>(null)

export const ShuttleVehiclesProvider = ({ shuttles, children }: Props) => (
  <ShuttleVehiclesContext.Provider value={shuttles}>
    {children}
  </ShuttleVehiclesContext.Provider>
)
