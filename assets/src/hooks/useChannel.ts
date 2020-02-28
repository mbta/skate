import { Channel, Socket } from "phoenix"
import { useEffect, useState } from "react"
import { reload } from "../models/browser"

/** Opens a channel for the given topic
 *  and returns the latest data that's been pushed to it
 *
 *  Only listens for a single event
 *  Assumes the data returned on join and the data from subsequent pushes are the same format
 *  If topic is null, does not open a channel.
 */
export const useChannel = <T>({
  socket,
  topic,
  event,
  parser,
  loadingState,
}: {
  socket: Socket | undefined
  topic: string | null
  event: string
  parser: (data: any) => T
  loadingState: T
}): T => {
  const [result, setResult] = useState<T>(loadingState)

  useEffect(() => {
    setResult(loadingState)
    let channel: Channel | undefined

    if (socket !== undefined && topic !== null) {
      channel = socket.channel(topic)
      channel.on(event, ({ data: data }) => {
        setResult(parser(data))
      })
      channel
        .join()
        .receive("ok", ({ data: data }) => {
          setResult(parser(data))
        })
        .receive("error", ({ reason }) =>
          // tslint:disable-next-line: no-console
          console.error(`joining topic ${topic} failed`, reason)
        )
        .receive("timeout", () => {
          reload(true)
        })
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, topic, event, loadingState])
  return result
}
