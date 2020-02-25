import { Channel, Socket } from "phoenix"
import { useEffect, useState } from "react"
import { reload } from "../models/browser"

/** Opens a channel for the given topic
 *  and returns the latest data that's been pushed to it
 *
 *  Only listens for a single event
 *  Assumes the data returned on join and the data from subsequent pushes are the same format
 *  If topic is null, does not open a channel.
 *  Returns offState if the channel is not open yet
 *  Returns loadingState after the channel has been opened but before receiving the first response
 */
export const useChannel = <T>({
  socket,
  topic,
  event,
  parser,
  loadingState,
  offState,
}: {
  socket: Socket | undefined
  topic: string | null
  event: string
  parser: (data: any) => T
  loadingState: T
  offState: T
}): T => {
  const [result, setResult] = useState<T>(offState)

  useEffect(() => {
    let channel: Channel | undefined

    if (socket !== undefined && topic !== null) {
      setResult(loadingState)
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
    } else {
      setResult(offState)
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, topic, event, loadingState, offState])
  return result
}
