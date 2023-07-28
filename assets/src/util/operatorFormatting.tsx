import { Vehicle } from "../realtime"
import { joinTruthy } from "../helpers/dom"

export const formatOperatorName = (
  operatorFirstName: string | null,
  operatorLastName: string | null,
  operatorId: string | null
): string => {
  return joinTruthy(
    [operatorFirstName, operatorLastName, `#${operatorId}`],
    " "
  )
}

export const formatOperatorNameFromVehicle = (value: Vehicle): string => {
  return formatOperatorName(
    value.operatorFirstName,
    value.operatorLastName,
    value.operatorId
  )
}
