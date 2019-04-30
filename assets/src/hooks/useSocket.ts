import { Socket } from "phoenix"
import { useEffect, useState } from "react"

const useSocket = (): Socket | undefined => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined)

  useEffect(() => {
    const initialSocket = new Socket("/socket")
    initialSocket.connect()
    setSocket(initialSocket)
  }, [])

  return socket
}

export default useSocket
