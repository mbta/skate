import React, { useId } from "react"
import { formattedTimeDiffUnderThreshold } from "../util/dateTime"
import { UnreadIcon } from "../helpers/icon"
import CloseButton from "./closeButton"

export type CardStyle = "kiwi" | "white"

interface CardProps {
  children?: React.ReactNode
  style: CardStyle
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
  style,
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
    </>
  )

  return (
    <div
      className={
        `m-card m-card--${style}` +
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
          <CloseButton closeButtonType="xl_green" onClick={closeCallback} />
        </div>
      ) : null}
    </div>
  )
}

export const CardBody: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <div className="m-card__body">{children}</div>

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
    <table className="m-card__properties">
      <tbody>
        {properties.map((property) =>
          property.value ? (
            <CardPropertyRow property={property} key={property.label} />
          ) : null
        )}
      </tbody>
    </table>
  )
}

export interface CardPropertyRowProps {
  property: Property
}

const CardPropertyRow: React.FC<CardPropertyRowProps> = ({
  property,
}: CardPropertyRowProps) => {
  const id = "card-property-label-" + useId()
  return (
    <tr>
      <th className="m-card__properties-label" id={id} scope="row">
        {property.label}
      </th>
      <td
        className={
          "m-card__properties-value" +
          (property.sensitive
            ? " m-card__properties-value--sensitive fs-mask"
            : "")
        }
        aria-labelledby={id}
      >
        {property.value}
      </td>
    </tr>
  )
}
