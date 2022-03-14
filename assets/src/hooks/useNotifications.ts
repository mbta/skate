import { Channel, Socket } from "phoenix"
import { useContext, useEffect } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { reload } from "../models/browser"
import {
  NotificationData,
  notificationFromData,
} from "../models/notificationData"
import { Notification } from "../realtime.d"
import { allOpenRouteIds } from "../models/routeTab"

export const useNotifications = (
  handleNewNotification: (notification: Notification) => void,
  handleInitialNotifications: (notificationsData: NotificationData[]) => void
): void => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const topic: string = "notifications"
  const event: string = "notification"
  const [{ routeTabs }] = useContext(StateDispatchContext)

  useEffect(() => {
    let channel: Channel | undefined

    if (socket !== undefined) {
      channel = socket.channel(topic)
      channel.on(event, ({ data: data }) => {
        const notification: Notification = notificationFromData(data)
        handleNewNotification(notification)
      })
      channel
        .join()
        .receive(
          "ok",
          (data) =>
            data.initial_notifications &&
            handleInitialNotifications(data.initial_notifications)
        )
        .receive("error", ({ reason }) =>
          // tslint:disable-next-line: no-console
          console.error(`joining topic ${topic} failed`, reason)
        )
        .receive("timeout", reload)
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, JSON.stringify(allOpenRouteIds(routeTabs))])
}
