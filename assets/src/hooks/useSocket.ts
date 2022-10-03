import { Socket } from "phoenix"
import { useEffect, useState } from "react"
import appData from "../appData"
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
    const initialSocket = new Socket("/socket", {
      params: { token: userToken },
    })
    initialSocket.connect()
    initialSocket.onOpen(() => setConnectionStatus(ConnectionStatus.Connected))
    initialSocket.onClose(() =>
      setConnectionStatus(ConnectionStatus.Disconnected)
    )
    setSocket(initialSocket)

    return () => {
      setConnectionStatus(ConnectionStatus.Disconnected)
    }
  }, [userToken])

  return { socket, connectionStatus }
}

export default useSocket
