import React from "react"
import CloseButton from "./closeButton"
import { formattedTimeDiffUnderThreshold } from "../util/dateTime"

interface CardProps {
  currentTime: Date
  openCallback?: () => void
  closeCallback?: () => void
  isUnread?: boolean
  additionalClass?: string
  title: string
  time?: Date
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
}) => {
  /* eslint-disable jsx-a11y/no-static-element-interactions */
  return (
    <div
      className={
        "m-card" +
        (additionalClass ? " " + additionalClass : "") +
        (openCallback ? " m-card--clickable" : "")
      }
      onClick={openCallback}
      onKeyDown={
        openCallback
          ? (event) => {
              if (event.key === "Enter") {
                openCallback()
              }
            }
          : undefined
      }
    >
      <div className="m-card__top-row">
        <div className="m-card__title">{title}</div>
        {time ? (
          <div className="m-card__time">
            {formattedTimeDiffUnderThreshold(currentTime, time, 60)}
          </div>
        ) : null}
        {isUnread ? (
          <div className="m-card__unread-marker">U</div>
        ) : closeCallback ? (
          <CloseButton onClick={closeCallback} />
        ) : null}
      </div>
      <div className="m-card__contents">{children}</div>
    </div>
  )
  /* eslint-enable jsx-a11y/no-static-element-interactions */
}

export const CardBody: React.FC = ({ children }) => (
  <div className="m-card__body">{children}</div>
)

export interface Property {
  label: string
  value: string | null
}

export interface CardPropertiesProps {
  properties: Property[]
}

export const CardProperties: React.VFC<CardPropertiesProps> = ({
  properties,
}: CardPropertiesProps) => {
  return (
    <div className="m-card__properties">
      <table>
        <tbody>
          {properties.map((property) => (
            <tr key={property.label}>
              <td className="m-card__properties-label">{property.label}</td>
              <td className="m-card__properties-value">{property.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
