import React, { useState } from "react"
import {
  Notification,
  DetourNotificationStatus,
  isDetourExpirationNotification,
  DetourNotifications,
  isDetourNotification,
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
          </div>
        </div>

        <div className="mt-3 fw-normal">
          {notification.content.expiresIn > 0 ? (
            <>
              This detour will reach its estimated{" "}
              <strong className="d-inline-block">
                {notification.content.estimatedDuration}
              </strong>{" "}
              duration in{" "}
              <strong className="d-inline-block">
                {notification.content.expiresIn} minutes
              </strong>
              .
            </>
          ) : (
            <>
              This detour has reached its estimated{" "}
              <strong className="d-inline-block">
                {notification.content.estimatedDuration}
              </strong>{" "}
              duration.
            </>
          )}
        </div>
        {notification.content.isDispatcher && (
          <div className="mt-3 fw-normal">
            Please extend or close the detour.
          </div>
        )}
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
  }
  if (isDetourNotification(notification)) {
    switch (notification.content.status) {
      case DetourNotificationStatus.Activated: {
        return "Detour - Active"
      }
      case DetourNotificationStatus.Deactivated: {
        return "Detour - Closed"
      }
    }
  }

  return null
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
  const { detour } = useLoadDetour(detourId)

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
  unread,
  onClose,
  onRead,
  noFocusOrHover,
}: {
  notification: Notification<DetourNotifications>
  currentTime: Date
  unread: boolean
  onClose?: () => void
  onRead: (notification: Notification) => void
  noFocusOrHover?: boolean
}) => {
  const [showDetourModal, setShowDetourModal] = useState(false)
  const detourId = notification.content.detourId

  const onSelect = () => {
    setShowDetourModal(true)
  }

  const onCloseDetour = () => {
    setShowDetourModal(false)
  }

  return (
    <>
      <CardReadable
        currentTime={currentTime}
        title={notificationTitle(notification)}
        style="kiwi"
        isActive={unread}
        openCallback={() => {
          onRead(notification)
          onSelect()
        }}
        closeCallback={onClose}
        time={notification.createdAt}
        noFocusOrHover={noFocusOrHover}
      >
        <CardBody>
          <Description notification={notification} />
        </CardBody>
      </CardReadable>
      {showDetourModal && detourId && (
        <DetourNotificationModal
          show
          detourId={detourId}
          onClose={onCloseDetour}
        />
      )}
    </>
  )
}
