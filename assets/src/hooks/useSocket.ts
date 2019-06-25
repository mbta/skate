import { Socket } from "phoenix"
import { useEffect, useState } from "react"
import { UserToken } from "../skate"

export const readUserToken = (): UserToken | undefined => {
  const dataEl = document.getElementById("app")
  if (!dataEl) {
    return undefined
  }

  const token = dataEl.dataset.userToken as UserToken
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
