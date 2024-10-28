import React, { ReactElement, useId } from "react"
import { UnreadIcon } from "../helpers/icon"
import { formattedTimeDiffUnderThreshold } from "../util/dateTime"
import CloseButton from "./closeButton"
import PropertiesList, { Property } from "./propertiesList"

export type CardStyle = "kiwi" | "white" | "lemon"

interface CardProps {
  children?: React.ReactNode
  icon?: React.ReactNode
  style: CardStyle
  currentTime?: Date
  openCallback?: () => void
  closeCallback?: () => void
  isActive?: boolean
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
  isActive,
  additionalClass,
  title,
  time,
  noFocusOrHover,
  selected,
}) => {
  const labelId = "card-label-" + useId()

  const innerLeftContent = (
    <div className="c-card__left-content">
      <div className="c-card__top-row">
        <div className="c-card__title" id={labelId}>
          {title}
        </div>
        {currentTime && time ? (
          <div className="c-card__time">
            {formattedTimeDiffUnderThreshold(currentTime, time, 60)}
          </div>
        ) : null}
      </div>
      <div className="c-card__contents">{children}</div>
    </div>
  )

  return (
    <div
      className={
        `c-card c-card--${style}` +
        (additionalClass ? " " + additionalClass : "") +
        (noFocusOrHover ? " c-card--no-focus-or-hover" : "") +
        (!isActive ? " c-card--inactive" : "") +
        (selected ? " c-card--selected" : "")
      }
      aria-current={selected}
      aria-labelledby={labelId}
    >
      {openCallback ? (
        <button className="c-card__left" onClick={openCallback}>
          {icon && <div className="c-card__icon">{icon}</div>}
          {innerLeftContent}
        </button>
      ) : (
        <div className="c-card__left">
          {icon && <div className="c-card__icon">{icon}</div>}
          {innerLeftContent}
        </div>
      )}
      {closeCallback ? (
        <div className="c-card__right">
          <CloseButton closeButtonType="xl_green" onClick={closeCallback} />
        </div>
      ) : null}
    </div>
  )
}

export const CardReadable = (props: CardProps) => {
  return (
    <Card
      {...props}
      title={
        <>
          {props.isActive && <UnreadIcon />}
          {props.title}
        </>
      }
    />
  )
}

export const CardBody: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <div className="c-card__body">{children}</div>

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
