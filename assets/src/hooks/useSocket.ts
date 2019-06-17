import { Socket } from "phoenix"
import { useEffect, useState } from "react"
import { UserToken } from "../skate"

const useSocket = (userToken?: UserToken): Socket | undefined => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined)

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
