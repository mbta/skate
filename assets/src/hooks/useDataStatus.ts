import { Channel, Socket } from "phoenix"
import { useState, useEffect } from "react"
import { reload } from "../models/browser"

export type DataStatus = "good" | "outage"

const topic = "data_status"

const useDataStatus = (socket: Socket | undefined) => {
  const [state, setState] = useState<DataStatus>("good")

  useEffect(() => {
    if (socket !== undefined) {
      const channel: Channel = socket.channel(topic)
      channel.on("data_status", ({ data: status }) => {
        setState(status)
      })
      channel
        .join()
        .receive("ok", ({ data: status }) => {
          setState(status)
        })
        // tslint:disable-next-line: no-console
        .receive("error", ({ reason }) => console.error("join failed", reason))
        .receive("timeout", () => {
          reload(true)
        })
    }
  }, [socket])
  return state
}

export default useDataStatus
