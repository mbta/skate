import React, { useState } from "react"
import {
  Notification,
  DetourNotificationStatus,
  isDetourExpirationNotification,
  DetourNotifications,
} from "../../realtime"
import { CardBody, CardReadable } from "../card"
import { RoutePill } from "../routePill"
import { DetourModal } from "../detours/detourModal"
import { DetourId } from "../../models/detoursList"
import { useLoadDetour } from "../../hooks/useLoadDetour"

const Description = ({
  notification,
}: {
  notification: Notification<DetourNotifications>
}) => {
  if (isDetourExpirationNotification(notification)) {
    return (
      <>
        <div className="d-flex flex-row gap-2">
          <RoutePill routeName={notification.content.route} />
          <div>
            <div className="fw-semibold">{notification.content.headsign}</div>
            <div className="fw-normal text-body-secondary">
              From {notification.content.origin.split(" - ")[0]}
            </div>
            <div className="fw-normal">{notification.content.direction}</div>
            <div className="fw-normal">
              {notification.content.expiresIn > 0 ? (
                <>
                  This detour will reach its estimated{" "}
                  <strong>{notification.content.estimatedDuration}</strong>{" "}
                  duration in{" "}
                  <strong>{notification.content.expiresIn} minutes</strong>.
                </>
              ) : (
                <>
                  This detour has reached its estimated{" "}
                  <strong>{notification.content.estimatedDuration}</strong>{" "}
                  duration.
                </>
              )}
            </div>
            {notification.content.isDispatcher ? (
              <div className="fw-normal">
                Please extend or close the detour.
              </div>
            ) : (
              <div className="fw-normal">
                Please work with the dispatcher to extend or close the detour.
              </div>
            )}
          </div>
        </div>
      </>
    )
  }
  return (
    <>
      <div className="d-flex flex-row gap-2">
        <RoutePill routeName={notification.content.route} />
        <div>
          <div className="fw-semibold">{notification.content.headsign}</div>
          <div className="fw-normal text-body-secondary">
            From {notification.content.origin.split(" - ")[0]}
          </div>
          <div className="fw-normal">{notification.content.direction}</div>
        </div>
      </div>
    </>
  )
}

const notificationTitle = (notification: Notification<DetourNotifications>) => {
  if (isDetourExpirationNotification(notification)) {
    if (notification.content.expiresIn > 0) {
      return `Detour duration - ${notification.content.expiresIn} min warning`
    } else {
      return "Detour duration reached"
    }
  } else {
    switch (notification.content.status) {
      case DetourNotificationStatus.Activated: {
        return "Detour - Active"
      }
      case DetourNotificationStatus.Deactivated: {
        return "Detour - Closed"
      }
    }
  }
}

const DetourNotificationModal = ({
  detourId,
  show,
  onClose,
}: {
  detourId: DetourId
  show: boolean
  onClose: () => void
}) => {
  const detour = useLoadDetour(detourId)

  return detour ? (
    <DetourModal
      onClose={onClose}
      show={show}
      key={detourId ?? ""}
      snapshot={detour.state}
      author={detour.author}
      updatedAt={detour.updatedAt}
    />
  ) : null
}

export const DetourNotificationCard = ({
  notification,
  currentTime,
  isUnread,
  setNotificationRead,
  hideLatestNotification,
  noFocusOrHover,
}: {
  notification: Notification<DetourNotifications>
  currentTime: Date
  isUnread: boolean
  setNotificationRead: (notification: Notification) => void
  hideLatestNotification?: () => void
  noFocusOrHover?: boolean
}) => {
  const [showDetourModal, setShowDetourModal] = useState(false)
  const detourId = notification.content.detourId

  const onCloseDetour = () => {
    setShowDetourModal(false)
  }

  return (
    <CardReadable
      currentTime={currentTime}
      title={notificationTitle(notification)}
      style="kiwi"
      isActive={isUnread}
      openCallback={() => {
        setNotificationRead(notification)
        setShowDetourModal(true)

        if (hideLatestNotification) {
          hideLatestNotification()
        }
      }}
      closeCallback={hideLatestNotification}
      time={notification.createdAt}
      noFocusOrHover={noFocusOrHover}
    >
      <CardBody>
        <Description notification={notification} />
      </CardBody>
      {showDetourModal && detourId && (
        <DetourNotificationModal
          show
          detourId={detourId}
          onClose={onCloseDetour}
        />
      )}
    </CardReadable>
  )
}
