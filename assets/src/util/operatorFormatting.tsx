import { joinTruthy } from "../helpers/dom"
import { Vehicle } from "../realtime"

export const DefaultFallbackString = "Not Available"

type OptionParameters = {
  fallbackText?: string
}

export const formatOperatorName = (
  operatorFirstName: string | null,
  operatorLastName: string | null,
  operatorId: string | null,
  _options?: OptionParameters
): string => {
  return (
    joinTruthy([
      operatorFirstName,
      operatorLastName,
      operatorId && `#${operatorId}`,
    ]) ||
    _options?.fallbackText ||
    DefaultFallbackString
  )
}

export const formatOperatorNameFromVehicle = (
  value: Vehicle,
  options?: OptionParameters
): string => {
  return formatOperatorName(
    value.operatorFirstName,
    value.operatorLastName,
    value.operatorId,
    options
  )
}
