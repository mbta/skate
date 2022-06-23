import { Channel, Socket } from "phoenix"
import { useContext, useEffect, useState } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { reload } from "../models/browser"
import {
  NotificationData,
  notificationFromData,
} from "../models/notificationData"
import { Notification } from "../realtime.d"
import { allOpenRouteIds } from "../models/routeTab"
import { RouteId } from "../schedule"
import { equalByElements } from "../helpers/array"

export const useNotifications = (
  handleNewNotification: (notification: Notification) => void,
  handleInitialNotifications: (notificationsData: NotificationData[]) => void
): void => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const topic = "notifications"
  const event = "notification"
  const [{ routeTabs }] = useContext(StateDispatchContext)
  const [routeIds, setRouteIds] = useState<RouteId[]>(
    allOpenRouteIds(routeTabs)
  )

  const newRouteIds = allOpenRouteIds(routeTabs)

  if (!equalByElements(routeIds, newRouteIds)) {
    setRouteIds(newRouteIds)
  }

  /* eslint-disable react-hooks/exhaustive-deps */
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
          // eslint-disable-next-line no-console
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
  }, [socket, routeIds])
  /* eslint-enable react-hooks/exhaustive-deps */
}
