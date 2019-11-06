import { Socket } from "phoenix"
import React, { createContext, ReactElement } from "react"

export const SocketContext = createContext(undefined as Socket | undefined)

export const SocketProvider = ({
  socket,
  children,
}: {
  socket: Socket | undefined
  children: ReactElement<HTMLElement>
}) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  )
}
