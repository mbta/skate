import { Socket } from "phoenix"
import { useEffect, useState } from "react"
import appData from "../appData"
import { UserToken } from "../skate.d"

export const readUserToken = (): UserToken | undefined => {
  const data = appData()
  if (!data) {
    return undefined
  }

  const token = data.userToken as UserToken
  return token
}

const useSocket = (): Socket | undefined => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined)

  const userToken: UserToken | undefined = readUserToken()

  useEffect(() => {
    const initialSocket = new Socket("/socket", {
      params: { token: userToken },
    })
    initialSocket.connect()
    setSocket(initialSocket)
  }, [])

  return socket
}

export default useSocket
