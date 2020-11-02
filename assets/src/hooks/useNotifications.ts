import { Channel, Socket } from "phoenix"
import { useContext, useEffect } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { reload } from "../models/browser"
import { notificationsFromData } from "../models/notificationData"
import { Notification } from "../realtime.d"

export const useNotifications = (
  handleNewNotification: (notification: Notification) => void
): void => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const topic: string = "notifications"
  const event: string = "notifications"
  const [{ selectedRouteIds }] = useContext(StateDispatchContext)

  useEffect(() => {
    let channel: Channel | undefined

    if (socket !== undefined) {
      channel = socket.channel(topic)
      channel.on(event, ({ data: data }) => {
        const notifications: Notification[] = notificationsFromData(data)
        notifications.forEach(handleNewNotification)
      })
      channel
        .join()
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
  }, [socket, selectedRouteIds])
}
