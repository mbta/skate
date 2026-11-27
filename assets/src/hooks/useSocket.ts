import { Socket } from "phoenix"
import { useEffect, useState } from "react"
import appData from "../appData"
import {
  isReloadInFlight,
  registerSocket,
  unregisterSocket,
} from "../models/browser"
import { UserToken } from "../skate.d"

export enum ConnectionStatus {
  Loading = 1,
  Connected,
  Disconnected,
}

export interface SocketStatus {
  socket: Socket | undefined
  connectionStatus: ConnectionStatus
}

export const readUserToken = (): UserToken | undefined => {
  const data = appData()
  if (!data) {
    return undefined
  }

  const token = data.userToken as UserToken
  return token
}

const useSocket = (): SocketStatus => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.Loading
  )

  const userToken: UserToken | undefined = readUserToken()

  useEffect(() => {
    let isActive = true
    const initialSocket = new Socket("/socket", {
      params: { token: userToken },
    })
    registerSocket(initialSocket)
    initialSocket.connect()
    initialSocket.onOpen(() => {
      if (isActive) {
        setConnectionStatus(ConnectionStatus.Connected)
      }
    })
    initialSocket.onClose((_event: CloseEvent) => {
      if (isActive && !isReloadInFlight()) {
        setConnectionStatus(ConnectionStatus.Disconnected)
      }
    })
    setSocket(initialSocket)

    return () => {
      isActive = false
      unregisterSocket(initialSocket)
      initialSocket.disconnect(undefined, 1000)
    }
  }, [userToken])

  return { socket, connectionStatus }
}

export default useSocket
