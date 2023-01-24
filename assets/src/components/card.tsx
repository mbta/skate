import React, { ReactElement, useId } from "react"
import { formattedTimeDiffUnderThreshold } from "../util/dateTime"
import { UnreadIcon } from "../helpers/icon"
import CloseButton from "./closeButton"
import PropertiesList, { Property } from "./propertiesList"

export type CardStyle = "kiwi" | "white"

interface CardProps {
  children?: React.ReactNode
  icon?: React.ReactNode
  style: CardStyle
  currentTime?: Date
  openCallback?: () => void
  closeCallback?: () => void
  isUnread?: boolean
  additionalClass?: string
  title: string | ReactElement
  time?: Date
  noFocusOrHover?: boolean
  selected?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  icon,
  style,
  currentTime,
  openCallback,
  closeCallback,
  isUnread,
  additionalClass,
  title,
  time,
  noFocusOrHover,
  selected,
}) => {
  const labelId = "card-label-" + useId()

  const innerLeftContent = (
    <div className="m-card__left-content">
      <div className="m-card__top-row">
        <div className="m-card__title" id={labelId}>
          {isUnread ? <UnreadIcon /> : null}
          {title}
        </div>
        {currentTime && time ? (
          <div className="m-card__time">
            {formattedTimeDiffUnderThreshold(currentTime, time, 60)}
          </div>
        ) : null}
      </div>
      <div className="m-card__contents">{children}</div>
    </div>
  )

  return (
    <div
      className={
        `m-card m-card--${style}` +
        (additionalClass ? " " + additionalClass : "") +
        (noFocusOrHover ? " m-card--no-focus-or-hover" : "") +
        (!isUnread ? " m-card--read" : "") +
        (selected ? " m-card--selected" : "")
      }
      aria-current={selected}
      aria-labelledby={labelId}
    >
      {openCallback ? (
        <button className="m-card__left" onClick={openCallback}>
          {icon && <div className="m-card__icon">{icon}</div>}
          {innerLeftContent}
        </button>
      ) : (
        <div className="m-card__left">
          {icon && <div className="m-card__icon">{icon}</div>}
          {innerLeftContent}
        </div>
      )}
      {closeCallback ? (
        <div className="m-card__right">
          <CloseButton closeButtonType="xl_green" onClick={closeCallback} />
        </div>
      ) : null}
    </div>
  )
}

export const CardBody: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <div className="m-card__body">{children}</div>

export interface CardPropertiesProps {
  properties: Property[]
  highlightText?: string
}

export const CardProperties: React.VFC<CardPropertiesProps> = ({
  properties,
  highlightText,
}: CardPropertiesProps) => {
  return (
    <PropertiesList properties={properties} highlightText={highlightText} />
  )
}
