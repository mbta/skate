import { Socket } from "phoenix"
import { useEffect, useState } from "react"
import appData from "../appData"
import {
  isReloadInFlight,
  NORMAL_SOCKET_CLOSE_CODE,
  registerSocket,
  unregisterSocket,
} from "../helpers/socketLifecycle"
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
    let isMounted = true
    const initialSocket = new Socket("/socket", {
      params: { token: userToken },
    })
    registerSocket(initialSocket)
    initialSocket.connect()
    initialSocket.onOpen(() => {
      if (isMounted) {
        setConnectionStatus(ConnectionStatus.Connected)
      }
    })
    initialSocket.onClose((_event: CloseEvent) => {
      if (isMounted && !isReloadInFlight()) {
        setConnectionStatus(ConnectionStatus.Disconnected)
      }
    })
    setSocket(initialSocket)

    return () => {
      isMounted = false
      unregisterSocket(initialSocket)
      if (typeof initialSocket.disconnect === "function") {
        initialSocket.disconnect(undefined, NORMAL_SOCKET_CLOSE_CODE)
      }
    }
  }, [userToken])

  return { socket, connectionStatus }
}

export default useSocket
