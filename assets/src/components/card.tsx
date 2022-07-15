import React from "react"
import CloseButton from "./closeButton"
import { formattedTimeDiffUnderThreshold } from "../util/dateTime"
import { unreadIcon } from "../helpers/icon"

interface CardProps {
  currentTime?: Date
  openCallback?: () => void
  closeCallback?: () => void
  isUnread?: boolean
  additionalClass?: string
  title: string
  time?: Date
  noFocusOrHover?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  currentTime,
  openCallback,
  closeCallback,
  isUnread,
  additionalClass,
  title,
  time,
  noFocusOrHover,
}) => {
  const innerLeftContent = (
    <>
      <div className="m-card__top-row">
        <div className="m-card__title">
          {isUnread ? unreadIcon() : null}
          {title}
        </div>
        {currentTime && time ? (
          <div className="m-card__time">
            {formattedTimeDiffUnderThreshold(currentTime, time, 60)}
          </div>
        ) : null}
      </div>
      <div className="m-card__contents">{children}</div>
    </>
  )

  return (
    <div
      className={
        "m-card" +
        (additionalClass ? " " + additionalClass : "") +
        (noFocusOrHover ? " m-card--no-focus-or-hover" : "") +
        (!isUnread ? " m-card--read" : "")
      }
    >
      {openCallback ? (
        <button className="m-card__left" onClick={openCallback}>
          {innerLeftContent}
        </button>
      ) : (
        <div className="m-card__left">{innerLeftContent}</div>
      )}
      {closeCallback ? (
        <div className="m-card__right">
          <CloseButton onClick={closeCallback} />
        </div>
      ) : null}
    </div>
  )
}

export const CardBody: React.FC = ({ children }) => (
  <div className="m-card__body">{children}</div>
)

export interface Property {
  label: string
  value: string | null
  sensitive?: boolean
}

export interface CardPropertiesProps {
  properties: Property[]
}

export const CardProperties: React.VFC<CardPropertiesProps> = ({
  properties,
}: CardPropertiesProps) => {
  return (
    <ul className="m-card__properties">
      {properties.map((property) =>
        property.value ? (
          <li key={property.label}>
            <span className="m-card__properties-label">{property.label}</span>
            <span
              className={
                "m-card__properties-value" +
                (property.sensitive
                  ? " m-card__properties-value--sensitive"
                  : "")
              }
            >
              {property.value}
            </span>
          </li>
        ) : null
      )}
    </ul>
  )
}
